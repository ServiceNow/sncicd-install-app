import * as core from '@actions/core'
import axios from 'axios'

import {
    RequestResult,
    AppProps,
    axiosConfig,
    Errors,
    requestOptions,
    RequestResponse,
    ResponseStatus,
    User,
    ErrorResult,
    Params,
} from './App.types'

export default class App {
    TRIGGER_FAIL = 'fail_trigger'
    sleepTime = 3000
    user: User
    config: axiosConfig
    props: AppProps
    errCodeMessages: any = {
        401: 'The user credentials are incorrect.',
        403: 'Forbidden. The user is not an admin or does not have the CICD role.',
        404: 'Not found. The requested item was not found.',
        405: 'Invalid method. The functionality is disabled.',
        409: 'Conflict. The requested item is not unique.',
        500: 'Internal server error. An unexpected error occurred while processing the request.',
    }

    constructor(props: AppProps) {
        this.props = props
        this.user = {
            username: props.username,
            password: props.password,
        }
        this.config = {
            headers: {
                'User-Agent': 'sncicd_extint_github',
                Accept: 'application/json',
            },
            auth: this.user,
        }
    }

    buildParams(options: requestOptions): string {
        return (
            Object.keys(options)
                .filter(key => options.hasOwnProperty(key))
                // @ts-ignore
                .map(key => `${key}=${encodeURIComponent(options[key])}`)
                .join('&')
        )
    }
    /**
     * Takes options object, convert it to encoded URI string
     * and append to the request url
     *
     * @param options   Set of options to be appended as params
     *
     * @returns string  Url to API
     */
    buildRequestUrl(options: requestOptions): string {
        if (!this.props.snowInstallInstance || (!options.sys_id && !options.scope))
            throw new Error(Errors.INCORRECT_CONFIG)

        const params: string = this.buildParams(options)
        return `https://${this.props.snowInstallInstance}.service-now.com/api/sn_cicd/app_repo/install?${params}`
    }

    /**
     * Checks version
     * Increment version
     * Makes the request to SNow api install_app
     * Prints the progress
     * @returns         Promise void
     */
    async installApp(): Promise<void | never> {
        try {
            const version = this.getInputVersion()
            const params: Params = {}
            if (!this.props.appSysID) {
                params.scope = this.props.scope
            } else {
                params.sys_id = this.props.appSysID
            }
            const options: requestOptions = {
                ...params,
                version: version,
            }

            const url: string = this.buildRequestUrl(options)
            const response: RequestResponse = await axios.post(url, {}, this.config)
            await this.printStatus(response.data.result)
        } catch (error) {
            let message: string
            if (error.response && error.response.status) {
                if (this.errCodeMessages[error.response.status]) {
                    message = this.errCodeMessages[error.response.status]
                } else {
                    const result: ErrorResult = error.response.data.result
                    message = result.error || result.status_message
                }
            } else {
                message = error.message
            }
            throw new Error(message)
        }
    }

    /**
     * Some kind of throttling, it used to limit the number of requests
     * in the recursion
     *
     * @param ms    Number of milliseconds to wait
     *
     * @returns     Promise void
     */
    sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    /**
     * Print the result of the task.
     * Execution will continue.
     * Task will be working until it get the response with successful or failed or canceled status.
     * Set output rollBack_version variable
     *
     * @param result    TaskResult enum of Succeeded, SucceededWithIssues, Failed, Cancelled or Skipped.
     *
     * @returns         void
     */
    async printStatus(result: RequestResult): Promise<void> {
        if (+result.status === ResponseStatus.Pending) {
            core.info(result.status_label)
            core.setOutput('rollbackVersion', result.rollback_version)
        }

        if (+result.status === ResponseStatus.Running || +result.status === ResponseStatus.Successful)
            core.info(`${result.status_label}: ${result.percent_complete}%`)

        // Recursion to check the status of the request
        if (+result.status < ResponseStatus.Successful) {
            const response: RequestResponse = await axios.get(result.links.progress.url, this.config)
            // Throttling
            await this.sleep(this.sleepTime)
            // Call itself if the request in the running or pending state
            await this.printStatus(response.data.result)
        } else {
            // for testing only!
            if (process.env.fail === 'true') throw new Error('Triggered step fail')
            // Log the success result, the step of the pipeline is success as well
            if (+result.status === ResponseStatus.Successful) {
                core.info(result.status_message)
                core.info(result.status_detail)
            }

            // Log the failed result, the step throw an error to fail the step
            if (+result.status === ResponseStatus.Failed) {
                throw new Error(result.error || result.status_message)
            }

            // Log the canceled result, the step throw an error to fail the step
            if (+result.status === ResponseStatus.Canceled) {
                throw new Error(Errors.CANCELLED)
            }
        }
    }

    /**
     * Gets the version with which the application will be installed.
     * version can be set in the workflow file
     * and read in the action.yml file from the input variable
     */
    getInputVersion(): string {
        const version: string | undefined = core.getInput('version')
        if (!version) throw new Error(Errors.MISSING_VERSION)
        return version
    }
}

import * as core from '@actions/core'
import axios from 'axios'
import App from '../App'
import { AppProps, Errors, requestOptions, RequestResponse } from '../App.types'

describe(`App lib`, () => {
    let props: AppProps;
    let options: requestOptions;

    const inputs: any = {
        version: '1.0.1',
    }

    beforeAll(() => {
        jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
            return inputs[name]
        })

        // Mock error/warning/info/debug
        jest.spyOn(core, 'error').mockImplementation(jest.fn())
        jest.spyOn(core, 'warning').mockImplementation(jest.fn())
        jest.spyOn(core, 'info').mockImplementation(jest.fn())
        jest.spyOn(core, 'debug').mockImplementation(jest.fn())
    })

    beforeEach(() => {
        props = { 
            username: 'abc',
            password: 'def', 
            appSysID: '123',
            scope: 'xyz', 
            nowInstallInstance: 'test',
        }

        options = { 
            sys_id: props.appSysID, 
            version: '1.1.1',
            base_app_version: '1.0.0',
            auto_upgrade_base_app: false,
        }
    })

    describe(`builds request url`, () => {
        it(`should return valid URL if all params are defined and correct`, () => {
            const app = new App(props);
            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/install?sys_id=${options.sys_id}&version=${options.version}&base_app_version=${options.base_app_version}&auto_upgrade_base_app=${options.auto_upgrade_base_app}`,
            )
        })

        it(`should ignore empty params`, () => {
            options.base_app_version = '';
            options.auto_upgrade_base_app = undefined;
            
            const app = new App(props);
            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/install?sys_id=${options.sys_id}&version=${options.version}`,
            )
        })
        
        it(`should throw an error without instance parameter`, () => {
            props.nowInstallInstance = ''
            const app = new App(props)

            expect(() => app.buildRequestUrl(options)).toThrow(Errors.INCORRECT_CONFIG)
        })

        it(`should fail without appScope or sys_id`, () => {
            options.sys_id = '';
            options.scope = '';
            const app = new App(props);

            expect(() => app.buildRequestUrl(options)).toThrow(Errors.INCORRECT_CONFIG);
        })

        it(`should works with just sys_id parameter`, () => {
            props.appSysID = '123'
            const options: requestOptions = { sys_id: props.appSysID, version: '1.1.1' }
            const app = new App(props)

            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/install?sys_id=${options.sys_id}&version=${options.version}`,
            )
        })

        it(`should works with just scope parameter`, () => {
            props.scope = '123'
            const options: requestOptions = { scope: props.scope, version: '1.1.1' }
            const app = new App(props)

            expect(app.buildRequestUrl(options)).toEqual(
                `https://${props.nowInstallInstance}.service-now.com/api/sn_cicd/app_repo/install?scope=${options.scope}&version=${options.version}`,
            )
        })
    })

    it(`Install app`, () => {
        const post = jest.spyOn(axios, 'post')
        const response: RequestResponse = {
            data: {
                result: {
                    links: {
                        progress: {
                            id: 'id',
                            url: 'http://test.xyz',
                        },
                    },
                    status: '2',
                    status_label: 'success',
                    status_message: 'label',
                    status_detail: 'detail',
                    error: '',
                    percent_complete: 100,
                    rollback_version: '1.0.0',
                },
            },
        }
        post.mockResolvedValue(response)
        jest.spyOn(global.console, 'log')
        props.appSysID = '123'
        const app = new App(props)
        app.installApp()
        expect(post).toHaveBeenCalled()
    })
    describe(`getInputVersion`, () => {
        it(`success`, () => {
            props.appSysID = '123'
            const app = new App(props)
            expect(app.getInputVersion()).toEqual('1.0.1')
        })
        it(`throws an error`, () => {
            props.appSysID = '123'
            inputs.version = undefined
            const app = new App(props)
            expect(() => app.getInputVersion()).toThrow(Errors.MISSING_VERSION)
        })
    })
})

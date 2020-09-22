export interface User {
    username: string;
    password: string;
}

export interface AppProps extends User {
    snowInstallInstance: string;
    appSysID?: string;
    scope?: string;
}
export interface Params {
    scope?: string;
    sys_id?: string;
}
export interface requestOptions extends Params {
    version: string;
}

export interface ErrorResult {
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
}

export enum Errors {
    USERNAME = 'snowUsername is not set',
    PASSWORD = 'snowPassword is not set',
    INSTALL_INSTANCE = 'snowInstallInstance is not set',
    SYSID_OR_SCOPE = 'Please specify scope or sys_id',
    INCORRECT_CONFIG = 'Configuration is incorrect',
    CANCELLED = 'Canceled',
    MISSING_VERSION = 'Version is not set in the workflow',
}

export interface RequestResponse {
    data: {
        result: RequestResult,
    };
}

export interface RequestResult {
    links: {
        progress: {
            id: string,
            url: string,
        },
    };
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
    percent_complete: number;
    rollback_version: string;
}

export enum ResponseStatus {
    Pending = 0,
    Running = 1,
    Successful = 2,
    Failed = 3,
    Canceled = 4,
}

export interface axiosConfig {
    headers: {
        Accept: string,
    };
    auth: User;
}

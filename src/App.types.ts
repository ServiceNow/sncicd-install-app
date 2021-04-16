export interface User {
    username: string;
    password: string;
}

export interface AppProps extends User {
    nowInstallInstance: string;
    appSysID?: string;
    scope?: string;
    appDebug?: boolean,
}
export interface Params {
    scope?: string;
    sys_id?: string;
}
export interface requestOptions extends Params {
    version: string;
    auto_upgrade_base_app?: boolean;
    base_app_version?: string;
}

export interface ErrorResult {
    status: string;
    status_label: string;
    status_message: string;
    status_detail: string;
    error: string;
}

export enum Errors {
    USERNAME = 'nowUsername is not set',
    PASSWORD = 'nowPassword is not set',
    INSTALL_INSTANCE = 'nowInstallInstance is not set',
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
        'User-Agent': string,
        Accept: string,
    };
    auth: User;
}

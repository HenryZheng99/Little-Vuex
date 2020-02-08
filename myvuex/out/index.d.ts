interface Option {
    state: object;
}
declare class Store {
    private options;
    getters: object;
    mutations: object;
    actions: object;
    _modules: moduleCollection;
    vmData: Option;
    commit(type: any, param: any): void;
    dispatch(type: any, param: any): void;
    constructor(options: Option);
    get state(): object;
}
declare class moduleCollection {
    root: object;
    register(path: any, rootModule: any): void;
    constructor(rootModule: any);
}
export declare const mapState: (stateList: any) => any;
export declare const mapGetters: (gettersList: any) => any;
export declare const mapMutations: (mutationsList: any) => any;
export declare const mapActions: (actionsList: any) => any;
declare const _default: {
    install: (_Vue: any) => void;
    Store: typeof Store;
};
export default _default;

export type PropHandler = {
	classProp: (className: string) => void;
	boolProp: (key: string) => void;
	regularProp: (key: string, value: any) => void;
};

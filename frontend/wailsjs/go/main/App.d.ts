// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {models} from '../models';
import {config} from '../models';
import {services} from '../models';

export function CreateCloudLLMModel(arg1:models.CloudLLMModel):Promise<void>;

export function DeleteCloudLLMModel(arg1:number):Promise<void>;

export function GetAppConfig():Promise<config.AppConfig>;

export function GetCloudLLMModelByID(arg1:number):Promise<models.CloudLLMModel>;

export function GetCloudLLMModels(arg1:number,arg2:number):Promise<services.CloudLLMModelPageResult>;

export function GetSetting(arg1:string):Promise<string>;

export function SetSetting(arg1:string,arg2:string):Promise<void>;

export function ToggleCloudLLMModelEnabled(arg1:number,arg2:boolean):Promise<void>;

export function UpdateCloudLLMModel(arg1:models.CloudLLMModel):Promise<void>;

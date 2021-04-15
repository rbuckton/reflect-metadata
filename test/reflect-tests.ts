import { ReflectApiType } from "./api";
import reflect_decorate from "./reflect-decorate";
import reflect_definemetadata from "./reflect-definemetadata";
import reflect_deletemetadata from "./reflect-deletemetadata";
import reflect_getmetadata from "./reflect-getmetadata";
import reflect_getownmetadata from "./reflect-getownmetadata";
import reflect_getmetadatakeys from "./reflect-getmetadatakeys";
import reflect_getownmetadatakeys from "./reflect-getownmetadatakeys";
import reflect_hasmetadata from "./reflect-hasmetadata";
import reflect_hasownmetadata from "./reflect-hasownmetadata";
import reflect_metadata from "./reflect-metadata";

export default function (Reflect: ReflectApiType) {
    reflect_decorate(Reflect);
    reflect_definemetadata(Reflect);
    reflect_deletemetadata(Reflect);
    reflect_getmetadata(Reflect);
    reflect_getownmetadata(Reflect);
    reflect_getmetadatakeys(Reflect);
    reflect_getownmetadatakeys(Reflect);
    reflect_hasmetadata(Reflect);
    reflect_hasownmetadata(Reflect);
    reflect_metadata(Reflect);
}
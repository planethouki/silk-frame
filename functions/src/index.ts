import {setGlobalOptions} from "firebase-functions";
import "./shared/firebase";

setGlobalOptions({maxInstances: 10});

export {createImageUpload} from "./createImageUpload";
export {completeImageUpload} from "./completeImageUpload";

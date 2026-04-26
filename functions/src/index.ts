import {setGlobalOptions} from "firebase-functions";
import "./shared/firebase";

setGlobalOptions({maxInstances: 10});

export {createImageUpload} from "./createImageUpload";
export {completeImageUpload} from "./completeImageUpload";
export {deleteImage} from "./deleteImage";
export {getHighResolutionImage} from "./getHighResolutionImage";
export {updateImageMetadata} from "./updateImageMetadata";
export {updateImageRating} from "./updateImageRating";

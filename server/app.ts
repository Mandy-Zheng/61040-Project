import ExclusivePostConcept from "./concepts/exclusivepost";
import FriendConcept from "./concepts/friend";
import ResumeConcept from "./concepts/resume";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const ExclusivePost = new ExclusivePostConcept();
export const Friend = new FriendConcept();
export const Resume = new ResumeConcept();

import AnnotationConcept from "./concepts/annotation";
import DependencyMapConcept from "./concepts/dependencymap";
import ExclusivePostConcept from "./concepts/exclusivepost";
import ResumeConcept from "./concepts/resume";
import UserConcept from "./concepts/user";
import ValidationConcept from "./concepts/validation";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const ExclusivePost = new ExclusivePostConcept();
export const Annotation = new AnnotationConcept();
export const Resume = new ResumeConcept();
export const DepMap = new DependencyMapConcept();
export const ValidationResume = new ValidationConcept("resumeValidation");
export const ValidationPost = new ValidationConcept("postValidation");
export const ValidationMap = new ValidationConcept("mapValidation");

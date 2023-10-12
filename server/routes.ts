import { ObjectId } from "mongodb";
import { Router, getExpressRouter } from "./framework/router";

import { Annotation, DepMap, ExclusivePost, Resume, User, ValidationMap, ValidationPost, ValidationResume, WebSession } from "./app";
import { AnnotationDoc } from "./concepts/annotation";
import { DependencyMapDoc } from "./concepts/dependencymap";
import { BadValuesError, NotAllowedError, NotFoundError } from "./concepts/errors";
import { ResumeDoc } from "./concepts/resume";
import { UserDoc } from "./concepts/user";
import { ValidationDoc } from "./concepts/validation";
import { WebSessionDoc } from "./concepts/websession";

// helper function that calculates rating based on an inital rating and how many people approved or disapproved the item
const calculateRating = (baseRating: number, validation: ValidationDoc) => {
  return Math.max(0, baseRating + 0.1 * (validation.haveValidated.length - validation.haveRefuted.length));
};

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  /**
   *
   * @param session session
   * @returns deletes posts, resumes, annotations, and maps made by the user in session and deletes user from any approvals or disapprovals as well as audience of posts
   *
   */
  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    const myPosts = await ExclusivePost.getByAuthor(user);
    const myResumes = await Resume.getByAuthor(user);
    const myNotes = await Annotation.getByAuthor(user);
    const myMaps = await DepMap.getMapByAuthor(user);
    await Promise.all(myPosts.map((post) => ExclusivePost.delete(post._id, user)));
    await Promise.all(myResumes.map((resume) => Resume.delete(resume._id, user)));
    await Promise.all(myNotes.map((note) => Annotation.delete(note._id, user)));
    await Promise.all(myMaps.map((map) => DepMap.delete(map._id, user)));
    await Promise.all(myPosts.map((post) => ValidationPost.delete(post._id.toString())));
    await Promise.all(myResumes.map((resume) => ValidationResume.delete(resume._id.toString())));
    await Promise.all(myMaps.map((map) => ValidationMap.delete(map._id.toString())));
    const validationsResume = await ValidationResume.getValidationByObjectId();
    const validationsPost = await ValidationPost.getValidationByObjectId();
    const validationsMap = await ValidationMap.getValidationByObjectId();
    const userIdString = user.toString();
    await Promise.all(validationsResume.map((validation) => ValidationResume.undoVote(validation.objectId, userIdString)));
    await Promise.all(validationsPost.map((validation) => ValidationPost.undoVote(validation.objectId, userIdString)));
    await Promise.all(validationsMap.map((validation) => ValidationMap.undoVote(validation.objectId, userIdString)));
    await ExclusivePost.deleteFromAudience(userIdString);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  // RESUME[User]

  /**
   *
   * @param session session
   * @param name a name (no quotes) e.g. Amanda
   * @param work Array of strings e.g. ["urop", "lab"]
   * @param school Array of strings e.g. ["MIT", "Harvard"]
   * @param field a field (no quotes) e.g. biology
   * @returns creates credentials with name, list of work credentials, list of past schools related to a field
   */
  @Router.post("/resume")
  async createResume(session: WebSessionDoc, name: string, work: Array<string>, school: Array<string>, field: string) {
    const user = WebSession.getUser(session);
    const existingResumes = await Resume.getByAuthor(user);
    const isResumeExists = existingResumes.some((res) => res.field === field);
    if (isResumeExists) {
      throw new BadValuesError("A resume with this field already exists. Did you mean to update an existing resume?");
    }
    const resume = await Resume.create(user, name, work, school, field);
    if (resume.resume) {
      await ValidationResume.create(resume.resume._id.toString());
    }
    return resume;
  }

  @Router.get("/resume")
  async getResume(session: WebSessionDoc) {
    WebSession.getUser(session);
    const resumes = await Resume.getByAuthor();
    const validations = await ValidationResume.getValidationOfObjectIds(resumes.map((res) => res._id.toString()));
    return resumes.map((res, index) => {
      return { rating: calculateRating(res.initialRating, validations[index]), resume: res };
    });
  }

  /**
   *
   * @param session session
   * @param username someones username (no quotes) e.g. Amanda
   * @returns resumes created by the user with username username
   */
  @Router.get("/resume/:username")
  async getResumeByUser(session: WebSessionDoc, username: string) {
    WebSession.getUser(session);
    const userAccount = await User.getUserByUsername(username);
    const resume = await Resume.getByAuthor(userAccount._id);
    const validation = await ValidationResume.getValidationOfObjectIds(resume.map((res) => res._id.toString()));
    return resume.map((res, idx) => {
      return { rating: calculateRating(res.initialRating, validation[idx]), resume: resume[idx] };
    });
  }

  /**
   *
   * @param session session
   * @param id id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @param update.name a name (no quotes) e.g. Amanda
   * @param update.field a field (no quotes) e.g. biology
   * @param update.work Array of strings e.g. ["urop", "lab"]
   * @param update.school Array of strings e.g. ["MIT", "Harvard"]
   * @returns update resume with id id
   */
  @Router.patch("/resume")
  async updateResume(session: WebSessionDoc, id: ObjectId, update: Partial<ResumeDoc>) {
    const user = WebSession.getUser(session);
    return await Resume.update(id, user, update);
  }

  /**
   *
   * @param session session
   * @param id id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @returns deletes resume with corresponding id if user in session is the author of the resume
   */
  @Router.delete("/resume/:id")
  async deleteResume(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const msg = await Resume.delete(id, user);
    await ValidationResume.delete(id.toString());
    return msg;
  }

  /**
   *
   * @param session session
   * @param fielda field (no quotes) e.g. biology
   * @param minimumRating number e.g 3.4
   * @returns get users with their resumes if their resume ratings are higher than minimumRating and field is field
   */
  @Router.get("/resume/experts/:field/:minimumRating")
  async getExperts(session: WebSessionDoc, field: string, minimumRating: number) {
    WebSession.getUser(session);
    if (isNaN(Number(minimumRating))) {
      throw new BadValuesError("Expected a number for minimum rating");
    }
    const resumes = await Resume.getByField(field);
    const relatedResumeIds = resumes.map((res) => res._id);
    const netValidations = await ValidationResume.getValidationOfObjectIds(relatedResumeIds.map((id) => id.toString()));
    const usernames = await User.idsToUsernames(resumes.map((res) => res.author));
    const userResume = usernames.map((user, index) => {
      return { user: user, rating: calculateRating(resumes[index].initialRating, netValidations[index]), resume: resumes[index] };
    });
    return userResume.filter((userInfo) => userInfo.rating >= Number(minimumRating));
  }

  // Validation[User, Resume]

  /**
   *
   * @param session session
   * @param id id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @returns show rating of resume and users that approved and dissaproved it
   */
  @Router.get("/validation/resume/:id")
  async getResumeValidationsById(session: WebSessionDoc, id: ObjectId) {
    WebSession.getUser(session);
    const validation = (await ValidationResume.getValidationByObjectId(id.toString()))[0];
    const resume = await Resume.getById(id);
    const approvals = await User.idsToUsernames(validation.haveValidated.map((ids) => new ObjectId(ids)));
    const disapprovals = await User.idsToUsernames(validation.haveRefuted.map((ids) => new ObjectId(ids)));
    return { rating: calculateRating(resume.initialRating, validation), resume: resume, approvals: approvals, disapprovals: disapprovals };
  }

  /**
   *
   * @param session session
   * @param id id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @returns approve resume with id id
   */
  @Router.patch("/validation/approval/resume/:id")
  async validateResume(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationResume.validate(id, user.toString());
    return { msg: `Successfully approved resume ${id}` };
  }

  /**
   *
   * @param session session
   * @param id  id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @returns disapprove resume with id id
   */
  @Router.patch("/validation/disapproval/resume/:id")
  async refuteResume(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationResume.refute(id, user.toString());
    return { msg: `Successfully disapproved resume ${id}` };
  }

  /**
   *
   * @param session session
   * @param id id of a resume e.g. 652724ee4b6d1aec45545d0a
   * @returns undo the approval or disapproval on resume with id id
   */
  @Router.patch("/validation/undoValidation/resume/:id")
  async undoVoteResume(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationResume.undoVote(id, user.toString());
    return { msg: `Cancelled vote on resume ${id}` };
  }

  // EXCLUSIVEPOST[User]

  /**
   *
   * @param session session
   * @param title title of post e.g. Happiness
   * @param content content of post e.g Life is good
   * @param audience Array of strings of usernames e.g. ["Amanda", "Flora"]
   * @param tags Array of strings (subjects of post) e.g. ["life", "biology"]
   * @returns creates a post with title = title, content = content, audience = audience + user in session, and tags = tags
   */
  @Router.post("/exclusivepost")
  async createPost(session: WebSessionDoc, title: string, content: string, audience: Array<string>, tags: Array<string>) {
    const user = WebSession.getUser(session);
    const username = (await User.getUserById(user)).username;
    const uniqueAudience = new Set(audience.map((str) => str.trim()));
    uniqueAudience.add(username);
    const accounts = await Promise.all([...uniqueAudience].map((member) => User.getUserByUsername(member)));
    const ids = accounts.map((member) => member._id.toString());
    const parsedTags = tags.map((str) => str.trim());
    const post = await ExclusivePost.createPost(user, title, content, ids, parsedTags);
    if (post.post) {
      await ValidationPost.create(post.post._id.toString());
    }
    return post;
  }

  /**
   *
   * @param session session
   * @returns gets all posts that the user in session can view
   */
  @Router.get("/exclusivepost")
  async getViewablePosts(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const posts = await ExclusivePost.getAllViewable(user.toString());
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    const validations = await ValidationPost.getValidationOfObjectIds(posts.map((post) => post._id.toString()));
    const authorToResume: Map<string, ResumeDoc[]> = new Map();
    for (let index = 0; index < authors.length; index++) {
      if (!authorToResume.has(authors[index])) {
        const resumes = await Resume.getByAuthor(posts[index].author);
        authorToResume.set(authors[index], resumes);
      }
    }
    return posts.map((post, index) => {
      const postRelatedResumes = authorToResume.get(authors[index]) ?? [];
      const ratings = postRelatedResumes.filter((res) => post.tags.includes(res.field)).map((res) => res.initialRating);
      const averageRating = postRelatedResumes.length === 0 || ratings.length === 0 ? 0 : ratings.reduce((partialSum, rate) => partialSum + rate, 0) / ratings.length;
      return { author: authors[index], rating: calculateRating(averageRating, validations[index]), post: post };
    });
  }

  /**
   *
   * @param session session
   * @param id id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns post if the user is allowed to view the post with id id
   */
  @Router.get("/exclusivepost/:id")
  async getViewablePostById(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const post = await ExclusivePost.getById(id, user);
    const author = await User.getUserById(post.author);
    const validation = (await ValidationPost.getValidationByObjectId(post._id.toString()))[0];
    const resumes = await Resume.getByAuthor(user);
    const ratings = resumes.filter((res) => post.tags.includes(res.field)).map((res) => res.initialRating);
    const averageRating = resumes.length === 0 || ratings.length === 0 ? 0 : ratings.reduce((partialSum, rate) => partialSum + rate, 0) / ratings.length;
    return { author: author.username, rating: calculateRating(averageRating, validation), post: post };
  }

  /**
   *
   * @param session session
   * @param username someones username (no quotes) e.g. Amanda
   * @returns all posts written by user with username username
   */
  //get posts viewable by user and written by specific author
  @Router.get("/exclusivepost/author/:username")
  async getViewablePostsByAuthor(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    if (!username) {
      throw new BadValuesError("Must provide a username");
    }
    const author = await User.getUserByUsername(username);
    const posts = await ExclusivePost.getAllViewable(user.toString(), author._id);
    const validation = await ValidationPost.getValidationOfObjectIds(posts.map((post) => post._id.toString()));
    const resumes = await Resume.getByAuthor(user);
    return {
      author: author.username,
      posts: posts.map((post, index) => {
        const ratings = resumes.filter((res) => post.tags.includes(res.field)).map((res) => res.initialRating);
        const averageRating = resumes.length === 0 || ratings.length === 0 ? 0 : ratings.reduce((partialSum, rate) => partialSum + rate, 0) / ratings.length;
        return { rating: calculateRating(averageRating, validation[index]), post: post };
      }),
    };
  }

  /**
   *
   * @param session session
   * @param id id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns deletes post with corresponding id if user in session is the author of the post
   */
  @Router.delete("/exclusivepost/:id")
  async deletePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const msg = await ExclusivePost.delete(id, user);
    await ValidationPost.delete(id.toString());
    return msg;
  }

  // Validation[User, ExclusivePost]

  /**
   *
   * @param session session
   * @param id  id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns show rating of post and users that approved and dissaproved it, if it is viewable to user in session
   */
  @Router.get("/validation/exclusivepost/:id")
  async getPostValidationsById(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const post = await ExclusivePost.getById(id, user);
    const author = await User.getUserById(post.author);
    const resumes = await Resume.getByAuthor(user);
    const ratings = resumes.filter((res) => post.tags.includes(res.field)).map((res) => res.initialRating);
    const averageRating = resumes.length === 0 || ratings.length === 0 ? 0 : ratings.reduce((partialSum, rate) => partialSum + rate, 0) / ratings.length;
    const validation = (await ValidationPost.getValidationByObjectId(id.toString()))[0];
    const approvals = await User.idsToUsernames(validation.haveValidated.map((ids) => new ObjectId(ids)));
    const disapprovals = await User.idsToUsernames(validation.haveRefuted.map((ids) => new ObjectId(ids)));
    return { author: author.username, rating: calculateRating(averageRating, validation), post: post, approvals: approvals, disapprovals: disapprovals };
  }

  /**
   *
   * @param session session
   * @param id id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns shows the credentials of the approvers of the post with id id, if it is viewable to user in session
   */
  @Router.get("/validation/approval/exclusivepost/:id")
  async showPostApproverCredentials(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const post = await ExclusivePost.getById(id, user);
    const validation = (await ValidationPost.getValidationByObjectId(id.toString()))[0];
    const validators = new Set([...validation.haveValidated]);
    const showValidatorCredentials = [];
    for (const tag of post.tags) {
      const usernames = await User.idsToUsernames([...validators].map((id) => new ObjectId(id)));
      const resumes = await Promise.all([...validators].map((author) => Resume.getByAuthorAndField(new ObjectId(author), tag)));
      const netValidations = await Promise.all(resumes.map((res) => (res ? ValidationResume.getValidationByObjectId(res._id.toString()) : [null])));
      const parseValidations = netValidations.map((validation) => validation[0]);
      const resumeRatings = usernames.map((username, index) => {
        const resume = resumes[index];
        const netValidation = parseValidations[index];
        return { user: username, rating: resume && netValidation ? calculateRating(resume.initialRating, netValidation) : 0 };
      });
      showValidatorCredentials.push({ field: tag, approvers: resumeRatings });
    }
    return showValidatorCredentials;
  }

  /**
   *
   * @param session session
   * @param id id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns shows the credentials of the disapprovers of the post with id id, if it is viewable to user in session
   */
  @Router.get("/validation/disapproval/exclusivepost/:id")
  async showPostDisapproverCredentials(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const post = await ExclusivePost.getById(id, user);
    const validation = (await ValidationPost.getValidationByObjectId(id.toString()))[0];
    const validators = new Set([...validation.haveRefuted]);
    const showValidatorCredentials = [];
    for (const tag of post.tags) {
      const usernames = await User.idsToUsernames([...validators].map((id) => new ObjectId(id)));
      const resumes = await Promise.all([...validators].map((author) => Resume.getByAuthorAndField(new ObjectId(author), tag)));
      const netValidations = await Promise.all(resumes.map((res) => (res ? ValidationResume.getValidationByObjectId(res._id.toString()) : [null])));
      const parseValidations = netValidations.map((validation) => validation[0]);
      const resumeRatings = usernames.map((username, index) => {
        const resume = resumes[index];
        const netValidation = parseValidations[index];
        return { user: username, rating: resume && netValidation ? calculateRating(resume.initialRating, netValidation) : 0 };
      });
      showValidatorCredentials.push({ field: tag, disapprovers: resumeRatings });
    }
    return showValidatorCredentials;
  }

  /**
   *
   * @param session session
   * @param id  id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns approve post with id id is user in session has access to post
   */
  @Router.patch("/validation/approval/exclusivepost/:id")
  async validatePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    await ExclusivePost.getById(id, user);
    await ValidationPost.validate(id.toString(), user.toString());
    return { msg: `Successfully approved post ${id}` };
  }

  /**
   *
   * @param session session
   * @param id  id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns disapprove post with id id is user in session has access to post
   */
  @Router.patch("/validation/disapproval/exclusivepost/:id")
  async refutePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    await ExclusivePost.getById(id, user);
    await ValidationPost.refute(id.toString(), user.toString());
    return { msg: `Successfully disapproved post ${id}` };
  }

  /**
   *
   * @param session session
   * @param id  id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns undo the approval or disapproval on post with id id is user in session has access to post
   */
  @Router.patch("/validation/undoValidation/exclusivepost/:id")
  async undoVotePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    await ExclusivePost.getById(id, user);
    await ValidationPost.undoVote(id.toString(), user.toString());
    return { msg: `Cancelled vote on post ${id}` };
  }

  // ANNOTATION[ExclusivePost, User]

  /**
   *
   * @param session session
   * @param postId id of the post to annotate e.g. 652724ee4b6d1aec45545d0a
   * @param comment annotation comment of post e.g. This is really cool
   * @param quote a substring of the content of the post with id postId e.g. "Life is"
   * @returns creates an annotation on post with postId at the specified quote with comment comment if user in session has acces to post
   */
  @Router.post("/annotation/exclusivepost")
  async createAnnotation(session: WebSessionDoc, postId: ObjectId, comment: string, quote: string) {
    if (!postId) {
      throw new BadValuesError("Must provide a post id to annotate");
    }
    const user = WebSession.getUser(session);
    const post = await ExclusivePost.getById(postId, user);
    if (post.content.indexOf(quote) === -1) {
      throw new NotFoundError("Quote not found in Post");
    }
    return await Annotation.create(postId, user, comment, quote);
  }

  /**
   *
   * @param session session
   * @param postId id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns displays all annotations on a post with id postId, sorted by the time the annotaitons were updated if user in session has access to post
   */
  @Router.get("/annotation/exclusivepost/:postId")
  async getPostAnnotationsSorted(session: WebSessionDoc, postId: ObjectId) {
    if (!postId) {
      throw new BadValuesError("Please provide a post id");
    }
    const user = WebSession.getUser(session);
    await ExclusivePost.getById(postId, user);
    return await Annotation.sortedAnnotations(postId);
  }

  /**
   *
   * @param session session
   * @returns all annotations made by user in session
   */
  @Router.get("/annotation/myAnnotations")
  async getMyAnnotations(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const notes = await Annotation.getByAuthor(user);
    return notes;
  }

  /**
   *
   * @param session session
   * @param id id of a annotation to edit e.g. 652724ee4b6d1aec45545d0a
   * @param update.comment annotation comment of post e.g. This is really cool
   * @param update.quote a substring of the content of the post with id postId e.g. "Life is"
   * @returns updates an existing annotation with id id if user in session is the author
   */
  @Router.patch("/annotation")
  async updateAnnotation(session: WebSessionDoc, id: ObjectId, update: Partial<AnnotationDoc>) {
    const user = WebSession.getUser(session);
    const note = await Annotation.getById(id);
    const post = await ExclusivePost.getById(note.original, user);
    if (update.quote && post.content.indexOf(update.quote) === -1) {
      throw new NotFoundError("Quote not found in Post");
    }
    return await Annotation.update(id, user, update);
  }

  /**
   *
   * @param session session
   * @param id id of an annotation e.g. 652724ee4b6d1aec45545d0a
   * @returns deletes annotation with id id if user in session is the author of the annotation
   */
  @Router.delete("/annotation/:id")
  async deleteAnnotation(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Annotation.delete(id, user);
  }

  /**
   *
   * @param session session
   * @param top an integer > 0 e.g. 2
   * @returns shows the top number of users with the most annotations
   */
  @Router.get("/annotation/topReviewers/:top")
  async suggestMostActiveReviewers(session: WebSessionDoc, top: number) {
    WebSession.getUser(session);
    const num = Number(top);
    if (isNaN(num)) {
      throw new BadValuesError("Expected a number");
    }
    if (!Number.isInteger(num) || !(num > 0)) {
      throw new BadValuesError("Expected an integer greater than 0");
    }
    const users = await User.getUsers();
    const annotationCounts = await Promise.all(users.map((user) => Annotation.getAnnotationCountByAuthor(user._id)));
    const activeUsernames = await User.idsToUsernames(users.map((user) => user._id));
    const userCounts = activeUsernames.map((username, idx) => {
      return { user: username, count: annotationCounts[idx] };
    });
    userCounts.sort((a, b) => b.count - a.count);
    return userCounts.slice(0, top);
  }

  // Dependency Map[User, ExclusivePost]

  /**
   *
   * @param session session
   * @param deps A json of key value pairs where keys are posts ids (prerequistes) and values are an Array of post ids (post requisites) e.g. {"652725144b6d1aec45545d0b": ["652724ee4b6d1aec45545d0a"], "652724ee4b6d1aec45545d0a": ["652725144b6d1aec45545d0c, 652725144b6d1aec45545d0d"]}
   * @param tags  Array of strings (subjects of post) e.g. ["life", "biology"]
   * @param title title of dependency map
   * @returns a dependency map of posts where some posts are prerequisits of post
   */
  @Router.post("/depmap")
  async createMap(session: WebSessionDoc, deps: Record<string, Array<string>>, tags: Array<string>, title: string) {
    const user = WebSession.getUser(session);
    try {
      const keyIds = Object.keys(deps);
      const valIds = Object.values(deps).reduce((accumulator, value) => accumulator.concat(value), []);
      const allItems = [...new Set([...keyIds, ...valIds])];
      await Promise.all(allItems.map((postId) => ExclusivePost.getById(new ObjectId(postId), user)));
      const map = await DepMap.create(user, deps, tags, title);
      if (map.depMap) {
        await ValidationMap.create(map.depMap._id.toString());
      }
      return map;
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new BadValuesError("postIds for dependency map not found");
      } else if (e instanceof NotAllowedError) {
        throw new BadValuesError("No access to view and link posts in map");
      } else {
        throw e;
      }
    }
  }

  @Router.get("/depmap")
  async getAllMap(session: WebSessionDoc) {
    WebSession.getUser(session);
    const maps = await DepMap.getMapById();
    const authors = await User.idsToUsernames(maps.map((map) => new ObjectId(map.author)));
    return maps.map((map, idx) => {
      return { author: authors[idx], map: map };
    });
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @returns dependency map with id id
   */
  @Router.get("/depmap/:id")
  async getMapById(session: WebSessionDoc, id: ObjectId) {
    WebSession.getUser(session);
    const map = await DepMap.getMapById(id);
    const authors = await User.idsToUsernames(map.map((m) => new ObjectId(m.author)));
    return map.map((m, idx) => {
      return { author: authors[idx], map: m };
    });
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @param update.deps A json of key value pairs where keys are posts ids (prerequistes) and values are an Array of post ids (post requisites) e.g. {"652725144b6d1aec45545d0b": ["652724ee4b6d1aec45545d0a"], "652724ee4b6d1aec45545d0a": ["652725144b6d1aec45545d0c, 652725144b6d1aec45545d0d"]}
   * @param update.tags  Array of strings (subjects of post) e.g. ["life", "biology"]
   * @param update.title  title of dependency map
   * @returns updates the dependency map with id id
   */
  @Router.patch("/depmap")
  async updateMap(session: WebSessionDoc, id: ObjectId, update: Partial<DependencyMapDoc>) {
    const user = WebSession.getUser(session);
    try {
      if (update.deps) {
        const deps = update.deps;
        const keyIds = Object.keys(deps);
        const valIds = Object.values(deps).reduce((accumulator, value) => accumulator.concat(value), []);
        const allItems = [...new Set([...keyIds, ...valIds])];
        await Promise.all(allItems.map((postId) => ExclusivePost.getById(new ObjectId(postId), user)));
      }
      return await DepMap.update(id, user, update);
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new BadValuesError("postIds for dependency map not found");
      } else if (e instanceof NotAllowedError) {
        throw new BadValuesError("No access to view and link posts in map");
      } else {
        throw e;
      }
    }
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @returns deletes dependency map with corresponding id if user in session is the author of the map
   */
  @Router.delete("/depmap/:id")
  async deleteMap(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    const msg = await DepMap.delete(id, user);
    await ValidationMap.delete(id.toString());
    return msg;
  }

  /**
   *
   * @param session session
   * @param postId id of a post e.g. 652724ee4b6d1aec45545d0a
   * @returns all dependency maps where the postId is a postrequisite in the map
   */
  @Router.get("/depmap/postprerequisite/:postId")
  async getPrerequisiteForPost(session: WebSessionDoc, postId: ObjectId) {
    const user = WebSession.getUser(session);
    if (!postId) {
      throw new BadValuesError("Please provide a post id");
    }
    await ExclusivePost.getById(postId, user);
    const maps = await DepMap.getMapById();
    const prerequisite = maps.filter((map) => {
      const vals = Object.values(map.deps).reduce((accumulator, value) => accumulator.concat(value), []);
      return vals.includes(postId.toString());
    });
    return prerequisite;
  }

  /**
   *
   * @param session session
   * @returns all maps where every post in map is viewable by user in session
   */
  @Router.get("/users/depmap/viewableMaps")
  async getFullyViewableMaps(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const viewableMap = [];
    const allMaps = await DepMap.getMapById();
    const authors = await User.idsToUsernames(allMaps.map((map) => new ObjectId(map.author)));
    for (let mapIdx = 0; mapIdx < allMaps.length; mapIdx++) {
      const map = allMaps[mapIdx];
      const vals = Object.values(map.deps).reduce((accumulator, value) => accumulator.concat(value), []);
      const keyIds = Object.keys(map.deps).map((id) => new ObjectId(id));
      const valIds = vals.map((id) => new ObjectId(id));
      const allPosts = new Set([...keyIds, ...valIds]);
      const allValidPosts = await ExclusivePost.filterValidPosts([...allPosts]);
      const viewablePosts = await ExclusivePost.filterViewablePosts(allValidPosts, user);
      if (viewablePosts.length === allValidPosts.length) {
        viewableMap.push({ author: authors[mapIdx], map: map });
      }
    }
    return viewableMap;
  }

  /**
   *
   * @param session session
   * @returns returns all dependency maps sorted by number of approvals and disapprovals
   */
  @Router.get("/validation/depmap/popular")
  async getPopularDepMap(session: WebSessionDoc) {
    WebSession.getUser(session);
    const maps = await DepMap.getMapById();
    const mapIds = maps.map((map) => map._id.toString());
    const authors = await User.idsToUsernames(maps.map((map) => new ObjectId(map.author)));
    const validations = await ValidationMap.getValidationOfObjectIds(mapIds);
    const validationWithTitles = validations.map((votes, idx) => {
      return { author: authors[idx], title: maps[idx], approve: votes.haveValidated.length, disapprove: votes.haveRefuted.length };
    });
    validationWithTitles.sort((a, b) => a.disapprove - b.disapprove);
    validationWithTitles.sort((a, b) => b.approve - a.approve);
    return validationWithTitles;
  }

  /**
   *
   * @param session session
   * @param topic a topic (no quotes) e.g. biology
   * @returns all dependency maps with topic in their tags
   */
  @Router.get("/depmap/search/topics/:topic")
  async getMapsByTopics(session: WebSessionDoc, topic: string) {
    WebSession.getUser(session);
    const maps = await DepMap.getMapById();
    const relevantMaps = maps.filter((map) => map.tags.includes(topic));
    const authors = await User.idsToUsernames(relevantMaps.map((map) => map.author));
    return relevantMaps.map((map, idx) => {
      return { author: authors[idx], map: map };
    });
  }

  // Validation[User, DependencyMap]

  /**
   *
   * @param session session
   * @returns get all dependency maps with information about users that approved or disapporved it
   */
  @Router.get("/validation/depmap")
  async getAllDepMapValidations(session: WebSessionDoc) {
    WebSession.getUser(session);
    const allMaps = await DepMap.getMapById();
    const authors = await User.idsToUsernames(allMaps.map((map) => new ObjectId(map.author)));
    const validations = await ValidationMap.getValidationOfObjectIds(allMaps.map((map) => map._id.toString()));
    const haveValidated = validations.map((validation) => validation.haveValidated.map((userId) => new ObjectId(userId)));
    const haveRefuted = validations.map((validation) => validation.haveRefuted.map((userId) => new ObjectId(userId)));
    const approvals = await Promise.all(haveValidated.map((users) => User.idsToUsernames(users)));
    const disapprovals = await Promise.all(haveRefuted.map((users) => User.idsToUsernames(users)));
    return allMaps.map((map, idx) => {
      return { author: authors[idx], map: map, approvals: approvals[idx], disapprovals: disapprovals[idx] };
    });
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @returns get dependency maps with id id with information about users that approved or disapporved it
   */
  @Router.get("/validation/depmap/:id")
  async getDepMapValidationsById(session: WebSessionDoc, id: ObjectId) {
    WebSession.getUser(session);
    const map = (await DepMap.getMapById(id))[0];
    const user = await User.getUserById(new ObjectId(map.author));
    const validation = (await ValidationMap.getValidationByObjectId(id.toString()))[0];
    const approvals = await User.idsToUsernames(validation.haveValidated.map((user) => new ObjectId(user)));
    const disapprovals = await User.idsToUsernames(validation.haveRefuted.map((user) => new ObjectId(user)));
    return { author: user.username, map: map, approvals: approvals, disapprovals: disapprovals };
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @returns approve dependency map with id id
   */
  @Router.patch("/validation/approval/depmap/:id")
  async validateDepMap(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationMap.validate(id, user.toString());
    return { msg: `Successfully approved map ${id}` };
  }

  /**
   *
   * @param session session
   * @param id  id of a dependencymap e.g. 652724ee4b6d1aec45545d0a
   * @returns disapprove dependencymap with id id
   */
  @Router.patch("/validation/disapproval/depmap/:id")
  async refuteDepMap(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationMap.refute(id, user.toString());
    return { msg: `Successfully disapproved map ${id}` };
  }

  /**
   *
   * @param session session
   * @param id id of a dependency map e.g. 652724ee4b6d1aec45545d0a
   * @returns undo the approval or disapproval on dependency map with id id
   */
  @Router.patch("/validation/undoValidation/depmap/:id")
  async undoVoteDepMap(session: WebSessionDoc, id: string) {
    const user = WebSession.getUser(session);
    await ValidationMap.undoVote(id, user.toString());
    return { msg: `Cancelled vote on map ${id}` };
  }
}

export default getExpressRouter(new Routes());

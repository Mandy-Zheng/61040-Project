import { ObjectId } from "mongodb";
import { Router, getExpressRouter } from "./framework/router";

import { ExclusivePost, Resume, User, WebSession } from "./app";
import { AnnotationDoc } from "./concepts/annotation";
import { ResumeDoc } from "./concepts/resume";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";

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

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.patch("/users")
  async restoreUser(session: WebSessionDoc, username: string, password: string) {
    // const user = WebSession.getUser(session);
    // WebSession.end(session);
    // return await User.delete(user);
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

  // EXCLUSIVEPOST

  @Router.post("/exclusiveposts")
  async createPost(session: WebSessionDoc, title: string, content: string, audience: string, tags: string) {
    const user = WebSession.getUser(session);
    const audienceIds = [user];
    for (const name of audience.split(",")) {
      const userObj = await User.getUserByUsername(name.trim());
      audienceIds.push(userObj._id);
    }
    return ExclusivePost.createPost(
      user,
      title,
      content,
      audienceIds,
      tags.split(",").map((str) => str.trim()),
    );
  }

  //get posts that are viewable by user
  @Router.get("/exclusiveposts")
  async getViewablePosts(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await ExclusivePost.getAllViewable(user);
  }

  //get posts viewable by user and written by specific author
  @Router.get("/exclusiveposts/:username")
  async getViewablePostsByAuthor(session: WebSessionDoc, username: string) {
    const user = WebSession.getUser(session);
    const authorId = (await User.getUserByUsername(username))._id;
    return await ExclusivePost.getViewableByAuthor(user, authorId);
  }

  // update audience of a post
  @Router.patch("/exclusiveposts/:id")
  async updatePostAudience(session: WebSessionDoc, id: ObjectId, audience: string) {
    const user = WebSession.getUser(session);
    const audienceIds = [user];
    for (const name of audience.split(",")) {
      const userObj = await User.getUserByUsername(name.trim());
      audienceIds.push(userObj._id);
    }
    return await ExclusivePost.updateAudience(id, user, audienceIds);
  }

  // delete post
  @Router.delete("/exclusiveposts/:id")
  async deletePost(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    return await ExclusivePost.delete(id, user);
  }

  // RESUME

  // create resume
  @Router.post("/resume")
  async createResume(session: WebSessionDoc, name: string, work: string, school: string, field: string) {
    const user = WebSession.getUser(session);
    return await Resume.create(user, name, work.split(","), school.split(","), field);
  }

  //get all resume
  @Router.get("/resume")
  async getResume() {
    return await Resume.getByUser();
  }

  //get resumes for a certain user
  @Router.get("/resume/:username")
  async getResumeByUser(username: string) {
    const userAccount = await User.getUserByUsername(username);
    return await Resume.getByUser(userAccount._id);
  }

  //update resume
  @Router.patch("/resume/:id")
  async updateResume(session: WebSessionDoc, id: ObjectId, update: Partial<ResumeDoc>) {
    const user = WebSession.getUser(session);
    return await Resume.update(id, { ...update, author: user });
  }

  // delete a resume
  @Router.delete("/resume/:id")
  async deleteResume(session: WebSessionDoc, id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Resume.delete(id, user);
  }

  // ANNOTATION

  //make an annotation on post
  @Router.post("/posts/:id")
  async createAnnotation(post: ObjectId, author: ObjectId, comment: string, start: number, end: number) {}

  //get annotations of a post sorted by time stamp
  @Router.post("/posts/:id")
  async getPostAnnotationsSorted(post: ObjectId) {}

  //update an annotaiton
  @Router.patch("/posts/:id/annotations/:id")
  async updateAnnotation(_id: ObjectId, update: Partial<AnnotationDoc>) {}

  //delete an annotation
  @Router.post("/posts/annotations/:id")
  async deleteAnnotation(_id: ObjectId, author: ObjectId) {}

  // COURSEMAP

  //get all coursemaps where all the posts in coursemaps is visible to user
  @Router.get("/coursemap/:user")
  async getViewableFullLessons(session: WebSessionDoc) {}

  //get most popular coursemaps
  @Router.get("/coursemap/popular")
  async getPopularCourseMap() {}

  //get coursemap where the post is an item in teh coursemap
  @Router.get("/post/:id/prerequisite")
  async getPostPrerequisite(_id: ObjectId) {
    //   If p.tag == empty:
    // 	return allCourseMap
    // return all CourseMap with CourseMap.tag intersect p > 0
  }

  //delete coursemap
  @Router.delete("/coursemap/:id")
  async deleteLessonBook(session: WebSessionDoc, _id: ObjectId) {
    //   If u == c.author:
    // 	For all annotation a where a.item == c:
    // 		Annotation[User, CourseMap].deleteAnnotaiton(a.id)
    // Validation[User, CourseMap].delete(c)
    // deleteCourseMap(c.id, u)
  }

  // VALIDATION

  // add validation when user approves of resume
  @Router.patch("/resume/:id/validate")
  async validateResume(session: WebSessionDoc, _id: ObjectId) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].validate(res, user)
  }

  // add refute when user disapproves of resume
  @Router.patch("/resume/:user/refute")
  async refuteResume(session: WebSessionDoc, user: string) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].refute(res, user)
  }

  // undo any user refute or validation on the resume
  @Router.patch("/resume/:id/cancelVote")
  async cancelVotes(session: WebSessionDoc, user: string) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].validate(res, user)
  }

  // get validators with higher resume rating than post and with similar tags
  @Router.get("/post/:_id/suggestValidators")
  async suggestValidatorsForPost(_id: ObjectId) {
    // 	resumes = set of all resumes with author = post.author and resume.field in post.tags
    // resumeRating = avg(ratings of all resume in resumes)
    // postRating = resumeRating +  weighted sum(Validation[User, ExclusivePost].netValidation(post))
    // validUsers = set
    // for all user in users:
    // 	res = find resume where resume.field = field and author = user
    // If res.rating +  weighted sum(Validation[User, Resume].netValidation(res))> postRating:
    // 	addUser to validUsers
    // Return validUsers
  }

  //get validators based on with resume ratings higher than inputed threshold and field in fields
  @Router.get("/validators/:threshold/:field")
  async suggestValidators(threshold: number, fields: Array<string>) {}

  //get rating of an exclusive post
  @Router.get("/exclusiveposts/:_id/rating")
  async getPostCredentials(_id: ObjectId) {
    // 	resumes = set of all resumes with author = user and resume.field in post.tags
    // resumeRating = avg(ratings of all resume in resumes)
    // return resumeRating + weighted sum(Validation[User,ExclusivePost].netValidation(post))
  }

  //get rating of a specific resume
  @Router.get("/resume/:_id/rating")
  async getResumeCredentials(_id: ObjectId) {
    // return res.rating + weighted sum(Validation[User, Resume].netValidation(res))
  }

  // add validate when user approves of post
  @Router.patch("/exclusiveposts/:id/validate")
  async addValidationToPost(session: WebSessionDoc, _id: ObjectId) {
    // resumes = set of all resumes with author = user and resume.field in post.field
    // 	resumeRae = avg(resume.rating in resumes)
    // userRate = resumeRate +  weighted sum(Validation[User, Resume].netValidation(res))
    // postRate =  resumeRate + weighted sum(Validation[User, ExclusivePost]. netValidation(post))
    // 	if userRate >= postRate:
    // Validation[User,ExclusivePost].validate(post, user)
  }

  // add validate when user disapproves of post
  @Router.patch("/exclusiveposts/:id/refute")
  async addRefuteToPost(session: WebSessionDoc, _id: ObjectId) {
    // resumes = set of all resumes with author = user and resume.field in post.field
    // 	resumeRae = avg(resume.rating in resumes)
    // userRate = resumeRate +  weighted sum(Validation[User, Resume].netValidation(res))
    // postRate =  resumeRate + weighted sum(Validation[User, ExclusivePost]. netValidation(post))
    // 	if userRate >= postRate:
    // Validation[User,ExclusivePost].refute(post, user)
  }

  // undo any validation or refute user placed on post
  @Router.patch("/exclusiveposts/:id/undoVote")
  async removeValidationFromPost(session: WebSessionDoc, _id: ObjectId) {
    // resumes = set of all resumes with author = user and resume.field in post.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating +  weighted sum(Validation[User, Resume].netValidation(res))
    // postRating =  resumeRating + weighted sum(Validation[User, ExclusivePost]. netValidation(post))
    // 	if userRate >= postRating:
    // Validation[User,ExclusivePost].refute(post, user)
    //
  }
}

export default getExpressRouter(new Routes());

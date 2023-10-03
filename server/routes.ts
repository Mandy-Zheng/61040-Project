import { Router } from "./framework/router";

import { Double } from "mongodb";
import { User, WebSession } from "./app";
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

  @Router.put("/users")
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

  // @Router.get("/posts")
  // async getPosts(author?: string) {
  //   let posts;
  //   if (author) {
  //     const id = (await User.getUserByUsername(author))._id;
  //     posts = await Post.getByAuthor(id);
  //   } else {
  //     posts = await Post.getPosts({});
  //   }
  //   return Responses.posts(posts);
  // }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, audience: Set<ObjectId>, tags: Set<String>, title: string) {
    //   const user = WebSession.getUser(session);
    //   const created = await Post.create(user, content, options);
    //   return { msg: created.msg, post: await Responses.post(created.post) };
    //   When f = ExclusivePost[User, ExclusivePost].createExclusivePost(user, content, audience, tags, title)
    // Validation[User, ExclusivePost].createValidation(res)
  }

  // @Router.patch("/posts/:_id")
  // async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
  //   const user = WebSession.getUser(session);
  //   await Post.isAuthor(user, _id);
  //   return await Post.update(_id, update);
  // }

  // @Router.delete("/posts/:_id")
  // async deletePost(session: WebSessionDoc, _id: ObjectId) {
  //   const user = WebSession.getUser(session);
  //   await Post.isAuthor(user, _id);
  //   return Post.delete(_id);
  // }

  @Router.get("/coursemap/:user")
  async getViewableFullLessons(session: WebSessionDoc) {}

  @Router.get("/coursemap/popular")
  async getPopularCourseMap() {}

  @Router.get("/post/:id/prerequisite")
  async getPostPrerequisite(_id: ObjectId) {
    //   If p.tag == empty:
    // 	return allCourseMap
    // return all CourseMap with CourseMap.tag intersect p > 0
  }

  @Router.delete("/coursemap/:id")
  async deleteLessonBook(session: WebSessionDoc, _id: ObjectId) {
    //   If u == c.author:
    // 	For all annotation a where a.item == c:
    // 		Annotation[User, CourseMap].deleteAnnotaiton(a.id)
    // Validation[User, CourseMap].delete(c)
    // deleteCourseMap(c.id, u)
  }

  @Router.put("/resume/:id/validate")
  async validateResume(session: WebSessionDoc, _id: ObjectId) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].validate(res, user)
  }

  @Router.put("/resume/:user/refute")
  async refuteResume(session: WebSessionDoc, user: string) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].refute(res, user)
  }

  @Router.put("/resume/:id/cancelVote")
  async cancelVotes(session: WebSessionDoc, user: string) {
    // 	resumes = set of all resumes with author = user and resume.field = res.field
    // 	resumeRating = avg(resume.rating in resumes)
    // userRate = resumeRating + weighted sum(Validation[User, Resume].netValidation(res))
    // if userRate >= res.rating:
    // 	Validation[User,Resume].validate(res, user)
  }

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
  @Router.get("/validators/:threshold/:field")
  async suggestValidators(threshold: Double, field: Set<string>) {}

  @Router.get("/post/:_id")
  async getPostCredentials(_id: ObjectId) {
    // 	resumes = set of all resumes with author = user and resume.field in post.tags
    // resumeRating = avg(ratings of all resume in resumes)
    // return resumeRating + weighted sum(Validation[User,ExclusivePost].netValidation(post))
  }

  @Router.get("/resume/:_id")
  async getResumeCredentials(_id: ObjectId) {
    // return res.rating + weighted sum(Validation[User, Resume].netValidation(res))
  }

  @Router.put("/posts/:id/validate")
  async addValidationToPost(user: User, _id: ObjectId) {
    // resumes = set of all resumes with author = user and resume.field in post.field
    // 	resumeRae = avg(resume.rating in resumes)
    // userRate = resumeRate +  weighted sum(Validation[User, Resume].netValidation(res))
    // postRate =  resumeRate + weighted sum(Validation[User, ExclusivePost]. netValidation(post))
    // 	if userRate >= postRate:
    // Validation[User,ExclusivePost].validate(post, user)
  }

  @Router.put("/posts/:id/undoVote")
  async removeValidationFromPost(user: User, _id: ObjectId) {
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
// TODO ANNOTATIONS

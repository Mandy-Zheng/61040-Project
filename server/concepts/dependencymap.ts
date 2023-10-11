import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface DependencyMapDoc extends BaseDoc {
  author: ObjectId;
  tags: Array<string>;
  title: string;
  allItems: Array<string>;
  deps: Record<string, Array<string>>;
}

export default class DependencyMapConcept {
  public readonly depMaps = new DocCollection<DependencyMapDoc>("depMap");

  async create(author: ObjectId, deps: Record<string, Array<string>>, tags: Array<string>, title: string) {
    const keyIds = Object.keys(deps);
    if (keyIds.length === 0) {
      throw new BadValuesError("Dependency map can't be empty");
    }
    const valIds = Object.values(deps).reduce((accumulator, value) => accumulator.concat(value), []);
    const allItems = [...new Set([...keyIds, ...valIds])];
    const _id = await this.depMaps.createOne({ title, tags, author, allItems, deps });
    return { msg: "Dependency Map Created Successfully!", depMap: await this.depMaps.readOne({ _id }) };
  }

  async getMapById(_id?: ObjectId) {
    const depMap = _id ? await this.depMaps.readMany({ _id }) : await this.depMaps.readMany({});
    if (_id && depMap.length === 0) {
      throw new NotFoundError(`Dependency Map with id: ${_id} cannot be found`);
    }
    return depMap;
  }

  async getMapByAuthor(author: ObjectId) {
    return await this.depMaps.readMany({ author });
  }

  private async canEdit(_id: ObjectId, author: ObjectId) {
    const depMap = (await this.getMapById(_id))[0];
    if (depMap.author.toString() !== author.toString()) {
      throw new NotAllowedError(`${author} has no access to edit Dependency Map ${_id}`);
    }
  }

  async update(_id: ObjectId, author: ObjectId, update: Partial<DependencyMapDoc>) {
    this.sanitizeUpdate(update);
    await this.canEdit(_id, author);
    if (update.deps) {
      const { deps, ...rest } = update;
      const keyIds = Object.keys(deps);
      const valIds = Object.values(deps).reduce((accumulator, value) => accumulator.concat(value), []);
      const allItems = [...new Set([...keyIds, ...valIds])];

      await this.depMaps.updateOne({ _id }, { deps: update.deps, allItems, ...rest });
    } else {
      await this.depMaps.updateOne({ _id }, update);
    }
    return { msg: "Dependency Map updated successfully!" };
  }

  private sanitizeUpdate(update: Partial<DependencyMapDoc>) {
    if (update.author) {
      throw new NotAllowedError("Cannot edit author of dependency map");
    }
  }

  async delete(_id: ObjectId, author: ObjectId) {
    await this.canEdit(_id, author);
    await this.depMaps.deleteOne({ _id });
    return { msg: "Dependency Map successfully deleted!" };
  }
}

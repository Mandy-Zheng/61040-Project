import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ValidationDoc extends BaseDoc {
  objectId: string;
  haveValidated: Array<string>;
  haveRefuted: Array<string>;
}

export default class ValidationConcept {
  public readonly validations;

  constructor(docName: string) {
    this.validations = new DocCollection<ValidationDoc>(docName);
  }

  async create(objectId: string) {
    const haveRefuted: Array<string> = [];
    const haveValidated: Array<string> = [];
    const _id = await this.validations.createOne({ objectId, haveValidated, haveRefuted });
    return { msg: "Validation successfully created!", validation: await this.validations.readOne({ _id }) };
  }

  private async haveVoted(item: ValidationDoc, user: string) {
    if (item.haveValidated.includes(user) || item.haveRefuted.includes(user)) {
      throw new NotAllowedError("Can't vote on object twice");
    }
  }

  async getValidationByObjectId(objectId?: string) {
    const item = objectId ? await this.validations.readMany({ objectId }) : await this.validations.readMany({});
    if (objectId && item.length === 0) {
      throw new NotFoundError(`Object with id: ${objectId} does not have validation`);
    }
    return item;
  }

  async getValidationOfObjectIds(objectIds: string[]) {
    const item = await this.validations.readMany({ objectId: { $in: objectIds } });
    return item;
  }

  async validate(objectId: string, user: string) {
    const item = (await this.getValidationByObjectId(objectId))[0];
    await this.haveVoted(item, user);
    await this.validations.updateOne({ objectId }, { haveValidated: [...item.haveValidated, user] });
    return { msg: `Successfully Validated ${objectId}!` };
  }

  async refute(objectId: string, user: string) {
    const item = (await this.getValidationByObjectId(objectId))[0];
    await this.haveVoted(item, user);
    await this.validations.updateOne({ objectId }, { haveRefuted: [...item.haveRefuted, user] });
    return { msg: `Successfully Refuted ${objectId}!` };
  }

  async undoVote(objectId: string, user: string) {
    const item = (await this.getValidationByObjectId(objectId))[0];
    const indexValidate = item.haveValidated.indexOf(user);
    const validated = item.haveValidated;
    if (indexValidate !== -1) {
      validated[indexValidate] = validated[validated.length - 1];
      validated.pop();
    }
    const indexRefute = item.haveRefuted.indexOf(user);
    const refuted = item.haveRefuted;
    if (indexRefute !== -1) {
      refuted[indexRefute] = refuted[refuted.length - 1];
      refuted.pop();
    }
    await this.validations.updateOne({ objectId }, { haveValidated: validated, haveRefuted: refuted });
    return { msg: `Successfully Unvoted ${objectId}!` };
  }

  async delete(objectId: string) {
    await this.validations.deleteOne({ objectId });
    return { msg: `Validation deleted successfully for object ${objectId}!` };
  }
}

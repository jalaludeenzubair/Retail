import { ReturnModelType } from "@typegoose/typegoose";
import { ProjectionType, Types, UpdateQuery, QueryFilter } from "mongoose";
import {
  DB_COLLECTION,
  DB_COLLECTION_NAME,
  ModelTypeMap,
} from "../../constants/db.js";

interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1 | string>;
}

class DBService<K extends keyof typeof DB_COLLECTION_NAME> {
  private model: ReturnModelType<any>;

  constructor(collectionName: K) {
    const modelKey = DB_COLLECTION_NAME[collectionName];
    const model = DB_COLLECTION[modelKey];

    if (!model) {
      throw new Error(
        `Model for collection '${modelKey}' not found in DB_COLLECTION`,
      );
    }

    this.model = model;
  }

  async createDoc(data: Partial<ModelTypeMap[K]>): Promise<ModelTypeMap[K]> {
    const doc = new this.model(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  async findById(
    id: string | Types.ObjectId,
    projection: ProjectionType<ModelTypeMap[K]> | null = null,
  ): Promise<ModelTypeMap[K] | null> {
    return this.model
      .findOne({ _id: id, deleteFlag: 1 }, projection)
      .lean()
      .exec();
  }

  async findBy(
    conditions: QueryFilter<ModelTypeMap[K]>,
    projection: ProjectionType<ModelTypeMap[K]> | null = null,
  ): Promise<ModelTypeMap[K] | null> {
    return this.model
      .findOne({ ...conditions, deleteFlag: 1 }, projection)
      .lean()
      .exec();
  }

  async findAll(
    conditions: QueryFilter<ModelTypeMap[K]> = {},
    projection: ProjectionType<ModelTypeMap[K]> | null = null,
    sort?: Record<string, 1 | -1 | string>,
  ): Promise<ModelTypeMap[K][]> {
    const filter = { ...conditions, deleteFlag: 1 };

    const query = this.model.find(filter, projection).lean();

    if (sort) {
      query.sort(sort);
    }

    return query.exec();
  }

  async findAllPaginate(
    conditions: QueryFilter<ModelTypeMap[K]> = {},
    projection: ProjectionType<ModelTypeMap[K]> | null = null,
    options: PaginateOptions = {},
  ): Promise<{
    docs: ModelTypeMap[K][];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  }> {
    const { page = 1, limit = 10, sort } = options;

    const skip = (page - 1) * limit;
    const filter = { ...conditions, deleteFlag: 1 };

    const query = this.model
      .find(filter, projection)
      .skip(skip)
      .limit(limit)
      .lean();

    if (sort) {
      query.sort(sort);
    }

    const [docs, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      docs: docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateQuery<ModelTypeMap[K]>,
    options: { upsert?: boolean } = {},
  ): Promise<ModelTypeMap[K] | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, deleteFlag: 1 },
        { ...data, updatedAt: new Date() },
        { new: true, upsert: options.upsert ?? false, ...options },
      )
      .lean()
      .exec();
  }

  async updateBy(
    conditions: QueryFilter<ModelTypeMap[K]>,
    data: UpdateQuery<ModelTypeMap[K]>,
  ): Promise<ModelTypeMap[K] | null> {
    const filter = { ...conditions, deleteFlag: 1 };

    return this.model
      .findOneAndUpdate(
        filter,
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .lean()
      .exec();
  }

  async softDeleteById(
    id: string | Types.ObjectId,
  ): Promise<ModelTypeMap[K] | null> {
    return this.model
      .findOneAndUpdate(
        { _id: id, deleteFlag: 1 },
        { deleteFlag: 0, deletedAt: new Date() },
        { new: true },
      )
      .lean()
      .exec();
  }

  async softDeleteBy(
    conditions: QueryFilter<ModelTypeMap[K]>,
  ): Promise<ModelTypeMap[K] | null> {
    return this.model
      .findOneAndUpdate(
        { ...conditions, deleteFlag: 1 },
        { deleteFlag: 0, deletedAt: new Date() },
        { new: true },
      )
      .lean()
      .exec();
  }

  async hardDeleteById(
    id: string | Types.ObjectId,
  ): Promise<ModelTypeMap[K] | null> {
    return this.model.findOneAndDelete({ _id: id }).lean().exec();
  }
  async aggregate(pipeline: any[]): Promise<ModelTypeMap[K][]> {
    return this.model.aggregate(pipeline).exec();
  }
}

export default DBService;

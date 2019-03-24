const Promise = require('bluebird');
const uuidV4 = require('uuid/v4');

class ModelAbstractService {

    constructor(collection, storage) {
        this.COLLECTION = collection;
        this.storage = storage;
        this.primaryKey = 'id';
    }

    all() {
        return new Promise((resolv, reject) => {
            this.storage.getCollection(this.COLLECTION)
                .then(col => {
                    col.find({}).toArray()
                        .then(items => {
                            resolv(items.map(this.modelMap))
                        })
                        .catch(reject)
                })
                .catch(reject)
        })
    }

    get(value) {
        return new Promise((resolv, reject) => {
            let query = {};
            query[this.primaryKey] = value;
            this.find(query)
                .then(data => {
                    if (0 >= data.length) {
                        reject({
                            status: 404,
                            message: 'Not Found'
                        })
                    }
                    resolv(data[0])

                })
                .catch(reject)
        });
    }

    find(query) {

        return new Promise((resolv, reject) => {
            this.storage.getCollection(this.COLLECTION)
                .then(col => {
                    col.find(query)
                        .toArray()
                        .then(items => {
                            resolv(items.map(this.modelMap));
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    create(data) {
        return new Promise((resolv, reject) => {
            this.bulkCreate([data])
                .then(result => {
                    resolv(result[0])
                })
                .catch(reject);
        });

    }

    update(id, data) {
        return new Promise((resolv, reject) => {
            this.get(id)
                .then(collection => {
                    let object = this.modelMap(data, null, null, collection);
                    this.storage.getCollection(this.COLLECTION).then(col => {

                        let query = {};
                        query[this.primaryKey] = id;
                        col.updateOne(query, {$set: object})
                            .then((re) => {
                                resolv(this.modelMap(object));
                            })
                            .catch(reject);
                    });
                })
                .catch(reject);
        });
    }

    bulkCreate(data) {
        let collections = data.map(this.modelMap);

        return new Promise((resolv, reject) => {
            this.storage.getCollection(this.COLLECTION)
                .then(col => {
                    col.insertMany(collections)
                        .then(elements => {
                            resolv(elements.ops.map(element => {
                                return this.modelMap(element);
                            }));
                        })
                        .catch(reject);
                })
                .catch(reject);
        });
    }

    modelMap(data, index, array, model) {
        return {
            id: data.id || model.id || uuidV4(),
            name: data.name || model.name,
        }
    }

    delete(id) {
        return new Promise((resolv, reject) => {
            this.get(id)
                .then((o)=>{
                    this.storage.getCollection(this.COLLECTION).then(col => {
                        col.deleteOne({[this.primaryKey]:id})
                            .then(resolv)
                            .catch(reject);
                    });
                })
                .catch(reject);
        });
    }
}

module.exports = ModelAbstractService;
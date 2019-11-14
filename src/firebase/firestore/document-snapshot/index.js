export default class DocumentSnapshot {
  constructor(id, data, ref) {
    this._id = id;
    this._data = data;
    this._ref = ref;
  }

  get exists() {
    const data = this._data;

    return !(data.__isDirty__ || data.__isDeleted__);
  }

  get id() {
    return this._id;
  }

  get ref() {
    return this._ref;
  }

  data() {
    return this.exists ? this._getData(this._data) : undefined;
  }

  get(path) {
    if (!this.exists) {
      return undefined;
    }
    const keys = path.split('.');
    let data = this._getData(this._data);

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data = data[key];
      } else {
        data = undefined;
        break;
      }
    }

    return data;
  }
  
  _getValue(_value) {
    if (typeof _value === 'string' && _value.startsWith('__ref__:')) {
      return this._buildRefFromPath(this.ref.firestore, _value.replace('__ref__:', ''));
    }
    
    if (_value instanceof Date) {
      const date = _value;

      return {
        toDate() {
          return date;
        },
      };
    }
    
    if (this._isObject(_value)) {
      return this._getData(_value);
    }
    
    if (Array.isArray(_value)) {
      return _value.map((item) => this._getValue(item));
    }
    
    return _value;
  }

  _getData(_data) {
    const data = Object.assign({}, _data);

    for (const key of Object.keys(data)) {
      data[key] = this._getValue(data[key]);
    }

    delete data.__isDirty__;
    delete data.__collection__;

    return data;
  }

  _buildRefFromPath(db, path) {
    const nodes = path.split('/');
    let ref = db;

    nodes.forEach((node, index) => {
      if (node) {
        if (index % 2 === 0) {
          ref = ref.collection(node);
        } else {
          ref = ref.doc(node);
        }
      }
    });

    return ref;
  }

  _isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }
}

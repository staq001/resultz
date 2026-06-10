type AnyObj = Record<string, any>;

function createDbMock() {
  let selectQueue: any[] = [];
  const queryResults: Record<string, any> = {};

  function makeThenable(getResult: () => any) {
    const builder: AnyObj = {};
    builder.then = (resolve: any, _reject: any) => {
      try {
        const r = getResult();
        return Promise.resolve(r).then(resolve);
      } catch (err) {
        return Promise.reject(err);
      }
    };
    return builder;
  }

  const api: AnyObj = {
    __clear() {
      selectQueue = [];
      for (const k in queryResults) delete queryResults[k];
    },
    __pushSelectResult(res: any) {
      selectQueue.push(res);
    },
    __setSelectResults(arr: any[]) {
      selectQueue = [...arr];
    },
    __setQueryResult(key: string, value: any) {
      const prev = queryResults[key];
      if (prev === undefined) {
        queryResults[key] = [value];
        return;
      }
      if (Array.isArray(prev)) {
        prev.push(value);
        return;
      }
      // convert to queue
      queryResults[key] = [prev, value];
    },
    select(_cols?: any) {
      const builderState: AnyObj = { table: null };

      const builder = new Proxy(
        {},
        {
          get(_, prop: string) {
            if (prop === "from") {
              return (table: any) => {
                builderState.table = table;
                return builder;
              };
            }
            if (
              prop === "where" ||
              prop === "orderBy" ||
              prop === "limit" ||
              prop === "offset" ||
              prop === "innerJoin" ||
              prop === "leftJoin"
            ) {
              return (..._args: any[]) => builder;
            }
            if (prop === "then")
              return makeThenable(() => selectQueue.shift() ?? []).then;
            return builder[prop];
          },
        },
      );

      return builder as any;
    },
    insert(table: any) {
      return {
        values: async (_vals: any) => [{ affectedRows: 1 }],
      };
    },
    // update is defined via getter/setter below so tests can override it safely
    delete(table: any) {
      const builder: AnyObj = {};
      builder.where = (..._args: any[]) => builder;
      builder.then = makeThenable(() => [{ affectedRows: 1 }]).then;
      return builder;
    },
    transaction: async (fn: any) => {
      const tx = {
        query: new Proxy(
          {},
          {
            get(_, table: string) {
              return {
                findFirst: async () => {
                  const r = queryResults[table as string];
                  if (Array.isArray(r)) return (r as any[]).shift();
                  return r;
                },
                findMany: async () => {
                  const r = queryResults[table as string];
                  if (Array.isArray(r)) return (r as any[]).shift();
                  return r;
                },
              };
            },
          },
        ),
        select: api.select,
        insert: api.insert,
        update: api.update,
        delete: api.delete,
      };

      return fn(tx);
    },
    query: new Proxy(
      {},
      {
        get(_, table: string) {
          return {
            findFirst: async () => {
              const r = queryResults[table as string];
              if (Array.isArray(r)) return (r as any[]).shift();
              return r;
            },
            findMany: async () => {
              const r = queryResults[table as string];
              if (Array.isArray(r)) return (r as any[]).shift();
              return r;
            },
          };
        },
      },
    ),
  } as AnyObj;

  // default update implementation (returns builder-like object)
  let _updateImpl = (table: any) => {
    const builder: AnyObj = {};
    builder.set = (_obj: any) => builder;
    builder.where = (..._args: any[]) => builder;
    builder.limit = (_n: number) => builder;
    builder.then = makeThenable(() => [{ affectedRows: 1 }]).then;
    return builder;
  };

  Object.defineProperty(api, "update", {
    configurable: true,
    get() {
      return _updateImpl;
    },
    set(newImpl: any) {
      // wrap assigned implementation so callers still get a builder with .set/.where
      _updateImpl = (table: any) => {
        const builder: AnyObj = {};
        builder.set = (_obj: any) => builder;
        builder.where = (..._args: any[]) => builder;
        builder.limit = (_n: number) => builder;
        builder.then = (resolve: any, reject: any) => {
          try {
            const res = newImpl(table);
            return Promise.resolve(res).then(resolve, reject);
          } catch (err) {
            return Promise.reject(err);
          }
        };
        return builder;
      };
    },
  });

  return api;
}

export const dbMock = createDbMock();

export default dbMock;

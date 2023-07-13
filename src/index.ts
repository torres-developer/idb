const openRequest = indexedDB.open("name", 1);

openRequest.onsuccess = function() {
  const db = openRequest.result;

  db.onversionchange = function() {
    db.close();
    alert("Database is outdated, please reload the page.");
  }
};

openRequest.onupgradeneeded = function(event) {
  const db = openRequest.result;

  switch (event.oldVersion) {
    case 0: break;
    default: break;
  }

  if (!db.objectStoreNames.contains("table"))
    db.createObjectStore("table", { keyPath: "id", autoIncrement: false });

  // const transaction = db.transaction(["table", "other-table"], "readonly");
  const transaction = db.transaction("table", "readwrite");

  const table = transaction.objectStore("table");

  const value = {
    id: "js",
    price: 10,
    created: new Date()
  };

  // const request = table.put(value, "key");
  const request = table.add(value);

  request.onsuccess = function() {
    console.log("Value  added to the store", request.result);

    fetch("/").then(response => {
      const request = table.add(value);

      request.onerror = function() {
        console.error(request.error.name);
      };
    });
  };

  request.onerror = function(event) {
    console.error("Error", request.error);

    if (request.error.name == "ConstraintError") {
      console.log("Value with such id already exists");

      event.preventDefault();
      event.stopPropagation();
    } else {

    }
  };

  transaction.oncomplete = function() {
    console.log("Transaction id complete");
  };

  transaction.onabort = function() {
    console.error("Error", transaction.error);
  };

  // transaction.abort();

  db.onerror = function(event) {
    //const request = event.target;

    //console.log("Error", request.error);
  };

  db.deleteObjectStore("table");
};

openRequest.onblocked = function() {

}

const updates: Map<number, (database: IDBDatabase) => void> = new Map([
  [0, function(_database: IDBDatabase) {

  }]
]);

function connect(name: string, version = 1) {
  return new Promise(
    (
      resolve: (database: IDBDatabase) => void,
      reject: (error: Error) => void
    ) => {
    const openDBRequest = window.indexedDB.open(name, version);

    openDBRequest.onsuccess = function() {
      // TODO check database.version and suggest a page reload

      resolve(openDBRequest.result);
    };

    openDBRequest.onupgradeneeded = function(event: IDBVersionChangeEvent) {
      //const database = event.target.result;
      const database = openDBRequest.result;

      // TODO check database.version and suggest a page reload

      initializate(event.oldVersion, database, updates);
    };

    openDBRequest.onblocked = function() {

    };

    openDBRequest.onerror = function() {
      reject(
        openDBRequest.error ??
          new Error("IDBOpenDBRequest Unknown Error")
      );
    };
  });
}

function deleteDatabase(name: string) {
  return new Promise(
    (
      resolve: (database: IDBDatabase) => void,
      reject: (error: Error) => void
    ) => {
    const openDBRequest = window.indexedDB.deleteDatabase(name);

    openDBRequest.onsuccess = function() {
      resolve(openDBRequest.result);
    };

    openDBRequest.onerror = function() {
      reject(
        openDBRequest.error ??
          new Error("IDBOpenDBRequest Unknown Error")
      );
    };
  });
}

function initializate(
  version: number,
  database: IDBDatabase,
  updates: Map<number, (database: IDBDatabase) => void>
) {
  for (let i = 0; i < version; i++) updates.get(i)?.(database);
}

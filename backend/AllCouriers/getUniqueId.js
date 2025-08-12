class UniqueIdGenerator {
    constructor() {
      this.usedIds = new Set();
    }
  
    generateUniqueId() {
      if (this.usedIds.size === 999) {
        throw new Error("All possible IDs between 1 and 999 have been used.");
      }
  
      let id;
      do {
        id = Math.floor(Math.random() * 999) + 1; // Generate random number between 1 and 999
      } while (this.usedIds.has(id));
  
      this.usedIds.add(id);
      return id;
    }
  }
  
  const idGenerator = new UniqueIdGenerator();
  
  function getUniqueId() {
    return idGenerator.generateUniqueId();
  }
  
  module.exports={getUniqueId};
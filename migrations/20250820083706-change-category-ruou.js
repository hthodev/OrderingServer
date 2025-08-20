const { ObjectId } = require("mongodb");

module.exports = {
  async up(db) {
    await db.collection("orders").updateMany(
      {
        "foods._id": "688dbb81fc6e12880565f074",
        "foods.category": "Nước"
      },
      {
        $set: { "foods.$[elem].category": "Rượu" }
      },
      {
        arrayFilters: [
          { "elem._id": "688dbb81fc6e12880565f074", "elem.category": "Nước" }
        ]
      }
    );
  },

  async down(db) {
    await db.collection("orders").updateMany(
      {
        "foods._id": "688dbb81fc6e12880565f074",
        "foods.category": "Rượu"
      },
      {
        $set: { "foods.$[elem].category": "Nước" }
      },
      {
        arrayFilters: [
          { "elem._id": "688dbb81fc6e12880565f074", "elem.category": "Rượu" }
        ]
      }
    );
  }
};

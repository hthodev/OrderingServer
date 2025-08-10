module.exports = {
  async up(db) {
    await db.collection('orders').updateMany({}, [
      {
        $set: {
          total: {
            $sum: {
              $map: {
                input: { $ifNull: ["$foods", []] },
                as: "f",
                in: {
                  $multiply: [
                    { $ifNull: ["$$f.price", 0] },
                    {
                      $max: [
                        {
                          $subtract: [
                            { $ifNull: ["$$f.quantity", 0] },
                            { $ifNull: ["$$f.return", 0] }
                          ]
                        },
                        0
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }
    ]);
  },

  async down(db) {
    await db.collection('orders').updateMany({}, { $unset: { total: 1 } });
  }
};

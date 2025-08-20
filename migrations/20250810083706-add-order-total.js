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
                  $let: {
                    vars: {
                      priceNum: {
                        $convert: { input: "$$f.price", to: "double", onError: 0, onNull: 0 }
                      },
                      qtyNum: {
                        $max: [
                          {
                            $subtract: [
                              { $convert: { input: "$$f.quantity", to: "double", onError: 0, onNull: 0 } },
                              { $convert: { input: "$$f.return",   to: "double", onError: 0, onNull: 0 } }
                            ]
                          },
                          0
                        ]
                      }
                    },
                    in: { $multiply: ["$$priceNum", "$$qtyNum"] }
                  }
                }
              }
            }
          }
        }
      },
      { $set: { total: { $toInt: { $round: ["$total", 0] } } } }
    ]);
  },

  async down(db) {
    await db.collection('orders').updateMany({}, { $unset: { total: 1 } });
  }
};

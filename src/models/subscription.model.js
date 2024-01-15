  import { Schema, mongoose } from "mongoose";

  const subcriptionSchema = new Schema({
    subscriber: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }
    ],
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  });

  const Subscription = mongoose.model("Subscription", subcriptionSchema);

  export { Subscription };

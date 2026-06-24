import create from "./create";
import deleteEvent from "./delete";
import modify from "./modify";
import rename from "./rename";

const events = {
  create: create,
  modify: modify,
  rename: rename,
  delete: deleteEvent,
};

export default events;

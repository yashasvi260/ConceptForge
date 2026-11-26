// Module 06, the same 512-run experiment with a small model (qwen2.5-coder:1.5b), to show that prompt
// techniques matter much more for small models. Jobs and sampling are identical to 06-experiment.mjs.
import base from "./06-experiment.mjs";

export default { ...base, out: "src/subjects/08-prompt-engineering/data/recordings/experiment-small.json", model: "qwen2.5-coder:1.5b" };

# Runs one exercise attempt. Loaded once per Pyodide instance; call _cf_run(...) per Run.
# The learner's code and the checks live in separate namespaces, so learner code cannot
# replace a check or tamper with the checks' copy of DATA.
import json as _cf_json
import sys as _cf_sys
import traceback as _cf_tb
from types import ModuleType as _cf_ModuleType

_CF_MAX = __CF_MAX_OUTPUT__

# Learner code shares this interpreter. Anything it changes in these modules (builtins.abs, json.dumps,
# numpy.allclose …) is undone before the checks run and again after, so a patch can't make a wrong
# answer pass or leak into later exercises.
_CF_PROTECT = ["builtins", "json", "math", "re", "random", "traceback", "numpy"]
_cf_saved = {}


def _cf_snapshot():
    for name in _CF_PROTECT:
        if name in _cf_saved:
            continue
        try:
            mod = __import__(name)
        except ImportError:
            continue  # numpy until its package is loaded
        _cf_saved[name] = (mod, dict(vars(mod)))


def _cf_restore():
    for mod, saved in _cf_saved.values():
        d = vars(mod)
        # Identity, not ==: module values include NaN and arrays, which don't compare cleanly.
        for k, v in saved.items():
            if d.get(k, saved) is not v:
                d[k] = v
        # Drop attributes the learner added, but keep submodules: importing (or numpy's lazy loading
        # of numpy.random, numpy.linalg …) adds those, and removing them makes numpy loop forever.
        for k in [k for k in d if k not in saved and not isinstance(d[k], _cf_ModuleType)]:
            del d[k]


class _CfCapped:
    def __init__(self):
        self.parts = []
        self.size = 0
        self.truncated = False

    def write(self, s):
        if self.truncated:
            return len(s)
        room = _CF_MAX - self.size
        if len(s) > room:
            self.parts.append(s[:room])
            self.size = _CF_MAX
            self.truncated = True
        else:
            self.parts.append(s)
            self.size += len(s)
        return len(s)

    def flush(self):
        pass

    def text(self):
        out = "".join(self.parts)
        return out + "\n… output truncated" if self.truncated else out


def _cf_error_line(e):
    name = type(e).__name__
    if isinstance(e, SyntaxError) and e.filename == "<your code>":
        return f"line {e.lineno}: {name}: {e.msg}"
    frames = [f for f in _cf_tb.extract_tb(e.__traceback__) if f.filename == "<your code>"]
    where = f"line {frames[-1].lineno}: " if frames else ""
    return f"{where}{name}: {e}"


def _cf_check_name(fn_name):
    return fn_name[len("check_"):].replace("_", " ")


def _cf_run(learner, prelude, checks, data_json):
    _cf_snapshot()
    _cf_restore()
    out = _CfCapped()
    old_out, old_err = _cf_sys.stdout, _cf_sys.stderr
    ns = {"__name__": "__main__", "DATA": _cf_json.loads(data_json)}
    error = None
    _cf_sys.stdout = _cf_sys.stderr = out
    try:
        if prelude.strip():
            exec(compile(prelude, "<earlier parts>", "exec"), ns)
        exec(compile(learner, "<your code>", "exec"), ns)
    except BaseException as e:  # noqa: BLE001 - report anything the learner raised
        error = _cf_error_line(e)
    finally:
        _cf_sys.stdout, _cf_sys.stderr = old_out, old_err
        _cf_restore()

    results = []
    if error is None:
        cns = {"__name__": "_cf_checks", "DATA": _cf_json.loads(data_json)}
        exec(compile(checks, "<checks>", "exec"), cns)
        fns = [(k, v) for k, v in cns.items() if k.startswith("check_") and callable(v)]
        snapshot = {k: v for k, v in ns.items() if k != "__builtins__"}
        for k, fn in fns:
            try:
                fn(dict(snapshot))
                results.append({"name": _cf_check_name(k), "ok": True, "message": ""})
            except AssertionError as e:
                results.append({"name": _cf_check_name(k), "ok": False, "message": str(e) or "check failed"})
            except KeyError as e:
                # Missing from the learner's namespace (the check's own ns[...] failed) vs a KeyError
                # raised inside the learner's code, which should point at their line.
                last = _cf_tb.extract_tb(e.__traceback__)[-1]
                msg = f"{e.args[0]} is not defined yet" if last.filename == "<checks>" else _cf_error_line(e)
                results.append({"name": _cf_check_name(k), "ok": False, "message": msg})
            except Exception as e:  # noqa: BLE001
                results.append({"name": _cf_check_name(k), "ok": False, "message": _cf_error_line(e)})
            finally:
                _cf_restore()

    if error is not None:
        status = "error"
    elif results and all(r["ok"] for r in results):
        status = "pass"
    else:
        status = "fail"
    return _cf_json.dumps({"status": status, "stdout": out.text(), "checks": results, "error": error})

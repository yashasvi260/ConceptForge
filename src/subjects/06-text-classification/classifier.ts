/**
 * A classification head: multinomial logistic regression (softmax) on frozen sentence vectors, trained with
 * plain full-batch gradient descent from zero weights, so every run gives the same result.
 */
export interface SoftmaxModel {
  W: number[][]; // classes × features
  b: number[];
  lossHistory: number[];
}

export function softmax(z: number[]): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp(v - m));
  const s = e.reduce((a, c) => a + c, 0);
  return e.map((v) => v / s);
}

export function predictProba(model: Pick<SoftmaxModel, "W" | "b">, x: ArrayLike<number>): number[] {
  const z = model.W.map((w, k) => {
    let s = model.b[k]!;
    for (let j = 0; j < w.length; j++) s += w[j]! * x[j]!;
    return s;
  });
  return softmax(z);
}

export function trainSoftmax(
  X: ArrayLike<number>[],
  y: number[],
  classes: number,
  opts: { epochs: number; lr: number; l2?: number },
): SoftmaxModel {
  const n = X.length;
  const d = X[0]?.length ?? 0;
  const l2 = opts.l2 ?? 0;
  const W = Array.from({ length: classes }, () => new Array<number>(d).fill(0));
  const b = new Array<number>(classes).fill(0);
  const lossHistory: number[] = [];
  for (let epoch = 0; epoch < opts.epochs; epoch++) {
    const gW = Array.from({ length: classes }, () => new Array<number>(d).fill(0));
    const gb = new Array<number>(classes).fill(0);
    let loss = 0;
    for (let i = 0; i < n; i++) {
      const x = X[i]!;
      const p = predictProba({ W, b }, x);
      loss -= Math.log(Math.max(p[y[i]!]!, 1e-12));
      for (let k = 0; k < classes; k++) {
        const err = p[k]! - (k === y[i] ? 1 : 0);
        gb[k]! += err;
        const row = gW[k]!;
        for (let j = 0; j < d; j++) row[j]! += err * x[j]!;
      }
    }
    lossHistory.push(n ? loss / n : 0);
    if (!n) continue;
    for (let k = 0; k < classes; k++) {
      b[k]! -= (opts.lr * gb[k]!) / n;
      const w = W[k]!;
      const g = gW[k]!;
      for (let j = 0; j < d; j++) w[j]! -= opts.lr * (g[j]! / n + l2 * w[j]!);
    }
  }
  return { W, b, lossHistory };
}

export function accuracy(truth: number[], pred: number[]): number {
  if (!truth.length) return 0;
  return truth.filter((t, i) => t === pred[i]).length / truth.length;
}

/** rows = true class, columns = predicted class */
export function confusionMatrix(truth: number[], pred: number[], classes: number): number[][] {
  const m = Array.from({ length: classes }, () => new Array<number>(classes).fill(0));
  truth.forEach((t, i) => m[t]![pred[i]!]!++);
  return m;
}

export function argmax(v: number[]): number {
  let best = 0;
  for (let i = 1; i < v.length; i++) if (v[i]! > v[best]!) best = i;
  return best;
}

# Worked example for "Training vs using": cross-entropy, gradient descent steps, and compute.
import json, math

loss_rows = [[p, round(-math.log(p), 3)] for p in (0.179, 0.5, 0.9, 0.99)]

# Tiny model: prediction = w * x. One training example x = 2, y = 6 (so the right w is 3).
w, x, y, lr = 1.0, 2.0, 6.0, 0.05
gd = []
for step in range(5):
    pred = w * x
    loss = (pred - y) ** 2
    grad = 2 * (pred - y) * x
    new_w = w - lr * grad
    gd.append([step + 1, round(w, 4), round(pred, 4), round(loss, 4), round(grad, 4), round(new_w, 4)])
    w = new_w

N, D = 8_030_261_248, 15e12
train = 6 * N * D
infer = 2 * N
print(json.dumps({
    "Cross-entropy loss for the correct next token": loss_rows,
    "Five steps of gradient descent on prediction = w · x": gd,
    "Compute for Llama 3 8B": [
        ["training: 6 · N · D", f"{train:.2e}"],
        ["one generated token: 2 · N", f"{infer:.2e}"],
        ["tokens you could generate with the training compute", f"{train / infer:.1e}"],
    ],
}))

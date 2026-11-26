def predict(w, x):
    """Inference: use the weight. Nothing is changed."""
    return w * x

def train_step(w, x, y, lr):
    """Training: one step of gradient descent on loss = (w*x - y)**2. Return the new w."""
    gradient = 2 * (w * x - y) * x
    return w - lr * gradient

w = 1.0
for step in range(5):
    w = train_step(w, 2.0, 6.0, 0.05)
    print(step + 1, round(w, 4), "prediction:", round(predict(w, 2.0), 4))

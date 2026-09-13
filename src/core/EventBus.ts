/** Minimalna szyna zdarzeń – używana m.in. przez BossFSM do sygnalizowania faz. */
type Handler<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private handlers: { [K in keyof Events]?: Handler<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    (this.handlers[event] ??= []).push(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    const list = this.handlers[event];
    if (!list) return;
    const i = list.indexOf(handler);
    if (i >= 0) list.splice(i, 1);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers[event]?.forEach((h) => h(payload));
  }
}

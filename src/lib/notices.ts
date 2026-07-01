// Shape for a "Novo" (notifications) item shown in the top-bar bell dropdown.
// New things since the admin's last visit; placeholder data until a /notifications
// endpoint exists. Used by the layout and the reusable <NoticeItem> component.
export type Notice = { id: string; title: string; detail: string; when: string; href: string };

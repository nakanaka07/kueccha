declare module 'emailjs-com' {
  export function send(
    serviceID: string,
    templateID: string,
    templateParams?: Record<string, string>,
    userID?: string,
  ): Promise<EmailJSResponseStatus>;

  export function sendForm(
    serviceID: string,
    templateID: string,
    form: string | HTMLFormElement,
    userID?: string,
  ): Promise<EmailJSResponseStatus>;

  export interface EmailJSResponseStatus {
    status: number;
    text: string;
  }
}

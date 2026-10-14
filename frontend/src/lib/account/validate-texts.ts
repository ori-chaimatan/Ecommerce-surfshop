/** Field error messages for the profile form. Same wording as the cms checks (cms/src/api/account). */
export const texts = {
  required: (label: string) => `Enter your ${label}.`,
  tooLong: (max: number) => `Use at most ${max} characters.`,
  email: 'Enter a valid email address.',
};

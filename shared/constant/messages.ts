const InfoMessages = {
  GENERIC: {
    ITEM_DELETE_SUCCESSFULLY: (key: string, id: string) =>
      `${key} item with ID: ${id} deleted successfully.`,
    ITEM_UPDATED_SUCCESSFULLY: (key: string, id: string) =>
      `${key} item with ID: ${id} updated successfully.`,
    ITEM_UPDATED_SUCCESSFULLY_ATTRIBUTE: (key: string, id: string, attribute: string) =>
      `Attribute ${attribute} of ${key} item with ID: ${id} updated successfully.`,
    ITEM_CREATED_SUCCESSFULLY: (key: string) => `${key} created successfully.`,
    ITEM_GET_SUCCESSFULLY: (key: string) => `${key} item fetched successfully.`,
  },
  AUTH: {
    PASSWORD_LENGTH_ERROR: 'Password must be at least 8 characters long.',
    SIGNIN_SUCESS:'SignedIn sucessfully'
  },
};

export default InfoMessages;

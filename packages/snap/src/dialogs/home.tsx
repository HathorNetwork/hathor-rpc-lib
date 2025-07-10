import { Box, Text, Heading } from '@metamask/snaps-sdk/jsx';

export const homePage = async () => {
  return {
    content: (
      <Box>
        <Heading>THIS IS HATHOR HOME PAGE!</Heading>
        <Text>Welcome to my Snap home page!</Text>
      </Box>
    ),
  };
}

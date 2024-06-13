import React from 'react';
import { Box, Text, IconButton, Image, Stack, useColorMode, Link as ChakraLink, Flex } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';



const GroupMediaContent = ({ message }) => {
  const { colorMode } = useColorMode();
  const textColor = colorMode === 'dark' ? "white" : "black";

  // Extract filename from URL
  const extractFileName = (url) => {
    if (!url) return 'Unknown file';
    return decodeURIComponent(url.split('/').pop().split('?')[0]);
  };

  // Handle download action
  const handleDownload = (url) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = extractFileName(url);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle media type and return appropriate JSX
  const renderMedia = (msg) => {
    const type = msg.subtype;
    const content = msg.message; // Access the message content
    if (!content) {
      console.log("No content found for message:", msg);
      return <Text color={textColor} fontSize="sm">No content available</Text>;
    }
    switch (type) {
      case 'img':
        return <Image src={content} alt="Uploaded Media" borderRadius="md" boxSize="100px" />;
      case 'doc':
        return (
          <Flex alignItems="center">
            <ChakraLink href={content} isExternal color={textColor} flex="1" fontSize="sm">
              {extractFileName(content)}
            </ChakraLink>
            <IconButton
              icon={<FiDownload />}
              onClick={() => handleDownload(content)}
              aria-label="Download"
              size="sm"
              ml={2}
            />
          </Flex>
        );
      case 'link':
        return (
          <Text as={Link} to={content} color="blue.500" fontSize="sm">
            Visit Link
          </Text>
        );
      default:
        return <Text color={textColor} fontSize="sm">Unsupported format</Text>;
    }
  };

  return (
    <Stack direction={"row"} justifyContent={message.incoming ? "start" : "end"} p={1} spacing={2}>
      <Box backgroundColor={message.incoming ? "gray.100" : "blue.500"} borderRadius="md" p={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {renderMedia(message)}
        </Stack>
      </Box>
    </Stack>
  );
};

export default GroupMediaContent;

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  Collapse,
  Flex,
  Icon,
  IconButton,
  Image,
  List,
  ListItem,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiFile,
  FiRepeat,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { format } from "date-fns";
import Actions from "./Actions";
import Header from "./Header";
import { PROTECTED } from "lib/routes";

function VideoPlayer({ url }) {
  return (
    <Box
      maxW={{ base: "100%", md: "90%" }}
      mx="auto"
      mt={5}
      objectFit="contain"
      orderRadius="md"
      overflow="hidden"
    >
      <video src={url} width="100%" height="100%" controls />
    </Box>
  );
}

export function RepostHeader({ originalPost, reposts }) {
  const { colorMode } = useColorMode(); // Access the current color mode

  const bgColor = colorMode === "light" ? "gray.100" : "gray.700";
  const textColor = colorMode === "light" ? "gray.500" : "gray.400";
  const linkColor = colorMode === "light" ? "blue.500" : "blue.300";

  return (
    <Flex align="center" px={2} py={0.5} bg={bgColor}>
      <Icon as={FiRepeat} boxSize={4} color={textColor} mr={1} />
      <Text fontSize="xs" color={textColor}>
        from{" "}
        {reposts.length > 0 ? (
          <>
            {reposts.map((repost, index) => (
              <Link
                key={index}
                to={`/protected/profile/${repost.username}`}
                color={linkColor}
                fontWeight="bold"
              >
                @{repost.username}
              </Link>
            ))}
          </>
        ) : (
          <Link
            to={`/protected/profile/${originalPost.username}`}
            color={linkColor}
            fontWeight="bold"
          >
            @{originalPost.username}
          </Link>
        )}
      </Text>
    </Flex>
  );
}

function extractFileName(url) {
  const regex = /\/([^/]+)\?/;
  const matches = url.match(regex);
  if (matches && matches.length > 1) {
    const filePath = matches[1];
    const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
    return decodeURIComponent(fileName.split("%2F").pop());
  }
  return null;
}

export default function Post({ post, reposts }) {
  const { text, files, photos, videos, originalPost } = post;
  const [showFiles, setShowFiles] = useState(false);
  const maxMediaHeight =
    photos?.length <= 4 && photos?.length > 0 ? "500px" : "500px";
  const media = [
    ...(photos ? photos.map((photo) => ({ type: "photo", url: photo })) : []),
    ...(videos ? videos.map((video) => ({ type: "video", url: video })) : []),
  ];
  const handleFilesToggle = () => {
    setShowFiles(!showFiles);
  };

  const isRepost = originalPost && originalPost.id;

  return (
    <Box
      p="0"
      mb={8}
      maxW={{ base: "auto", md: "600px" }}
      minW={{ base: "auto", md: "600px" }}
      textAlign="left"
    >
      <Box border="2px solid" borderColor="gray.100">
        <Header post={post} />
        {isRepost && (
          <>
            {reposts && reposts.length > 0 ? (
              reposts.map((repost, index) => (
                <RepostHeader
                  key={index}
                  originalPost={repost.originalPost}
                  reposts={repost.reposts}
                />
              ))
            ) : (
              <RepostHeader originalPost={originalPost} reposts={[]} />
            )}
          </>
        )}

        <Box p={2} pb={"58px"} mt={{ base: 0, md: 1 }}>
          {text && (
            <Text fontSize={{ base: "xs", md: "sm" }} mb={4} whiteSpace="pre-wrap">
              {text}
            </Text>
          )}

          {media.length > 0 && (
            <Center>
              <Flex
                align="center"
                justify="center"
                // height={maxMediaHeight}
                height={"250px"}
                // border={"1px solid #9F9F9F"}
                margin={"0px 10px"}
                borderRadius="md"
                overflow="hidden"
                alignItems="center"
              >
                <Carousel
                  showThumbs={false}
                  showStatus={false}
                  showIndicators={media.length > 1}
                  infiniteLoop={true}
                  autoPlay={false}
                  renderArrowPrev={(onClickHandler, hasPrev) =>
                    hasPrev && (
                      <Button
                        aria-label="Previous"
                        variant="ghost"
                        onClick={onClickHandler}
                        position="absolute"
                        top="50%"
                        left="4"
                        transform="translateY(-50%)"
                        bg="whiteAlpha.500"
                        _hover={{ bg: "whiteAlpha.500" }}
                        _active={{ bg: "whiteAlpha.500" }}
                        zIndex="999"
                      >
                        <Icon as={FiChevronLeft} />
                      </Button>
                    )
                  }
                  renderArrowNext={(onClickHandler, hasNext) =>
                    hasNext && (
                      <Button
                        aria-label="Next"
                        variant="ghost"
                        onClick={onClickHandler}
                        position="absolute"
                        top="50%"
                        right="4"
                        transform="translateY(-50%)"
                        bg="whiteAlpha.500"
                        _hover={{ bg: "whiteAlpha.500" }}
                        _active={{ bg: "whiteAlpha.500" }}
                        zIndex="999"
                      >
                        <Icon as={FiChevronRight} />
                      </Button>
                    )
                  }
                  renderIndicator={(
                    onClickHandler,
                    isSelected,
                    index,
                    label
                  ) => (
                    <Box
                      key={index}
                      bg={isSelected ? "blue.500" : "gray.300"}
                      display="inline-block"
                      borderRadius="full"
                      width="2"
                      height="2"
                      mx="1"
                      cursor="pointer"
                      onClick={onClickHandler}
                      _hover={{ bg: "blue.500" }}
                    />
                  )}
                >
                  {media.map((item, i) => (
                    <div key={i}>
                      {item.type === "photo" && (
                        <Image
                          src={item.url}
                          alt={`Photo ${i + 1}`}
                          objectFit="cover"
                          borderRadius="md"
                          maxHeight={maxMediaHeight}
                          minHeight={maxMediaHeight}
                          // maxHeight={"200px"}
                          // minHeight={"200px"}
                        />
                      )}
                      {item.type === "video" && <VideoPlayer url={item.url} />}
                    </div>
                  ))}
                </Carousel>
              </Flex>
            </Center>
          )}

          {files && files.length > 0 && (
            <VStack align="start" spacing={2}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Icon as={FiFile} boxSize={4} />}
                onClick={handleFilesToggle}
                rightIcon={showFiles ? <FiChevronUp /> : <FiChevronDown />}
              >
                Files
              </Button>
              <Collapse in={showFiles} animateOpacity>
                <List>
                  {files.map((file, index) => (
                    <ListItem key={index}>
                      <Link as={Link} to={file} target="_blank" download>
                        {extractFileName(file)}
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </VStack>
          )}
        </Box>

        <Actions post={post} reposts={reposts} />
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from "react";
import BgImage from "./forums-bg.svg";
import PlaceHolderOne from "./placeholder1.jpg";
import PlaceHolderTwo from "./placehoder2.jpg";
import NextIndicator from "./next-indicator.png";
import SortIcon from "./sort.png";
import {
  Menu,
  useDisclosure,
  Link,
  Modal,
  FormControl,
  FormLabel,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  IconButton,
  Container,
  Flex,
  Box,
  Image,
  Divider,
  Text,
  Stack,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  useBreakpointValue,
  VStack,
} from "@chakra-ui/react";
import {
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaComment,
  FaSearch,
  FaShare,
} from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { SearchIcon } from "@chakra-ui/icons";
import { FORUMS } from "lib/routes";
import { useAuth } from "hooks/auth";
import { app, db, auth, storage, firestore } from "lib/firebase";
import {
  collection,
  addDoc,
  getDoc,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  deleteDoc,
} from "@firebase/firestore";
import { PROTECTED } from "lib/routes";
import { Spinner } from "@chakra-ui/react";
import { transform } from "typescript";

function Loading() {
  return (
    <Stack>
      <Text fontSize="2xl">
        Loading <Spinner size="md" color="blue.500" />
      </Text>
    </Stack>
  );
}

function Comment({ user, text }) {
  return (
    <Box mt="2" p="2" bg="gray.100" borderRadius="md">
      <Button
        color="blue.500"
        as={Link}
        to={`${PROTECTED}/profile/${user}`}
        colorScheme={"#1041B2"}
        variant="link"
      >
        {user}
      </Button>
      <Text>{text}</Text>
    </Box>
  );
}

function Posts({
  members,
  forumTitle,
  forumId,
  postId,
  user,
  post,
  upvotes,
  createdAt,
  isFirstPost,
}) {
  const [showShare, setShowShare] = useState(false);
  const [votes, setVotes] = useState(upvotes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const authUser = useAuth();

  const [userVote, setUserVote] = useState(null);
  const [postComments, setPostComments] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedPost, setEditedPost] = useState(post);

  const isPostOwner = authUser?.user?.username === user;

  const isMember = members?.includes(auth?.currentUser?.uid);

  const handleEditPost = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { post: editedPost });
      setEditModalOpen(false);

      window.location.reload();
    } catch (error) {
      console.error("Error editing post: ", error);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
  };

  const handleDeletePost = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await deleteDoc(postDocRef);
      // Update the UI to reflect the deleted post
      // You might want to remove the post from the local state or refetch the posts
      window.location.reload();
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      const commentsCollectionRef = collection(postDocRef, "comments");
      const commentsSnapshot = await getDocs(commentsCollectionRef);
      const commentsData = commentsSnapshot.docs.map((doc) => doc.data());
      setPostComments(commentsData);
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async () => {
    if (commentText.trim() === "") {
      return;
    }

    try {
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      const commentsCollectionRef = collection(postDocRef, "comments");

      await addDoc(commentsCollectionRef, {
        user: authUser?.user?.username,
        text: commentText,
        createdAt: serverTimestamp(),
      });

      setPostComments((prevComments) => [
        ...prevComments,
        { user: authUser?.user?.username, text: commentText },
      ]);

      setCommentText("");
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!authUser?.user) return;

      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      const userVoteDocSnap = await getDoc(userVoteDocRef);

      if (userVoteDocSnap.exists()) {
        setUserVote(userVoteDocSnap.data().voteType);
      } else {
        setUserVote(null);
      }
    };

    fetchUserVote();
  }, [postId, authUser?.user]);

  const handleUpvote = async () => {
    if (!userVote) {
      // User hasn't voted yet, proceed with upvote logic
      setUserVote("upvote");
      setVotes(votes + 1);
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { upvotes: votes + 1 });
      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      await setDoc(userVoteDocRef, { voteType: "upvote" });
    } else if (userVote === "downvote") {
      // User has previously downvoted, allow them to switch to upvote
      setUserVote("upvote");
      setVotes(votes + 2); // Increase by 2 since we're reversing the downvote
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { upvotes: votes + 2 }); // Same reason here
      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      await setDoc(userVoteDocRef, { voteType: "upvote" });
    }
  };

  const handleDownvote = async () => {
    if (!userVote) {
      // User hasn't voted yet, proceed with downvote logic
      setUserVote("downvote");
      setVotes(votes - 1);
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { upvotes: votes - 1 });
      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      await setDoc(userVoteDocRef, { voteType: "downvote" });
    } else if (userVote === "upvote") {
      // User has previously upvoted, allow them to switch to downvote
      setUserVote("downvote");
      setVotes(votes - 2); // Decrease by 2 since we're reversing the upvote
      const postDocRef = doc(db, "forums", forumId, "posts", postId);
      await updateDoc(postDocRef, { upvotes: votes - 2 }); // Same reason here
      const userVoteDocRef = doc(
        db,
        "userVotes",
        `${authUser?.user?.uid}_${postId}`
      );
      await setDoc(userVoteDocRef, { voteType: "downvote" });
    }
  };

  const joinForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", forumId);
      const forumDoc = await getDoc(forumDocRef);

      if (forumDoc.exists()) {
        const forumData = forumDoc.data();
        const currentMembers = forumData.members || [];

        // Check if the user is already a member
        if (!currentMembers.includes(auth?.currentUser?.uid)) {
          // Add user's UID to the members array
          currentMembers.push(auth?.currentUser?.uid);

          // Update the members array in the database
          await updateDoc(forumDocRef, { members: currentMembers });

          // Update the local state to reflect the change
        }
      }

      window.location.reload();
    } catch (error) {
      console.error("Error joining forum: ", error);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    //weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(createdAt);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const backgroundColor = isFirstPost ? "white" : "#6899FE"; // make first post white, otherwise musicom blue
  const textColor = isFirstPost ? "black" : "white";

  return (
    <Box
      p="0"
      pr={{ base: 0, md: 10 }}
      pl={{ base: 0, md: 10 }}
      mr={{ base: 0, md: 30 }}
      ml={{ base: 0, md: 30 }}
      bg={backgroundColor}
      border={{ base: "0.5px solid blue", md: "2px solid #6899FE" }}
      borderRadius="md"
      position="relative"
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mt={{ base: -2, md: 0 }}
      >
        <Flex>
          <Stack spacing="1">
            <IconButton
              mt={2}
              icon={<FaArrowUp />}
              variant="ghost"
              size="10px"
              colorScheme="blue"
              onClick={handleUpvote}
            />
            <Text
              fontSize="10px"
              fontWeight="bold"
              textAlign="center"
              color={textColor}
            >
              {votes}
            </Text>
            <IconButton
              icon={<FaArrowDown />}
              variant="ghost"
              size="10px"
              colorScheme="red"
              onClick={handleDownvote}
            />
          </Stack>
        </Flex>
        <Box flex="1" ml="4">
          <Flex justifyContent="space-between"></Flex>
          <Flex
            alignItems="center"
            justifyContent="space-between"
            color="gray.500"
            mt="1"
          >
            <Text
              fontSize={{ base: "sm", md: "xl" }}
              fontWeight="600"
              color={textColor}
              mt={3}
            >
              <Link href={`/protected/forums/${forumTitle}/${forumId}`}>
                {forumTitle}
              </Link>
            </Text>
            {isPostOwner && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  colorScheme="gray"
                />
                <MenuList>
                  <MenuItem onClick={handleEditPost}>Edit Post</MenuItem>
                  <MenuItem onClick={handleDeletePost}>Delete Post</MenuItem>
                </MenuList>
              </Menu>
            )}
            {isMember ? (
              <></>
            ) : (
              <Button
                backgroundColor={"green"}
                colorScheme={"green"}
                border={"1px solid white"}
                mt={3}
                size={{ base: "xs", md: "sm" }}
                onClick={() => joinForum(forumId)}
              >
                Join
              </Button>
            )}
          </Flex>
          <Text fontSize="md"></Text>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            mt="2"
            color="white"
          ></Flex>
        </Box>
      </Flex>
      {!isMobile && <Divider mt={{ base: 1, md: 2 }} />}
      <Modal isOpen={editModalOpen} onClose={handleCancelEdit}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={editedPost}
              onChange={(e) => setEditedPost(e.target.value)}
              placeholder="Edit your post..."
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSaveEdit}>
              Save
            </Button>
            <Button variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function Forum({ id, title, owner, members, posts }) {
  return (
    <Box
      p="4"
      bg="white"
      boxShadow="sm"
      mb="4"
      borderRadius="md"
      position="relative"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <Text>
          <Link
            href={`/protected/forums/${title}/${id}`}
            fontSize="md"
            fontWeight="bold"
            color="blue.500"
          >
            {title}
          </Link>
        </Text>
        <Text color="grey" size="sm">
          {members?.length + " members"}
        </Text>
      </Flex>
      {/* Rest of the forum details */}
    </Box>
  );
}

function ForumPage() {
  const authUser = useAuth();
  const [forumTitle, setForumTitle] = useState("");
  const [forums, setForums] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isMyForumsModalOpen, setIsMyForumsModalOpen] = useState(false);
  const [userJoinedForums, setUserJoinedForums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("upvotes");

  const uid = auth.currentUser.uid;

  const [isCreateForumModalOpen, setIsCreateForumModalOpen] = useState(false);

  const openCreateForumModal = () => {
    setIsCreateForumModalOpen(true);
  };

  const closeCreateForumModal = () => {
    setIsCreateForumModalOpen(false);
  };

  const createForum = async () => {
    if (forumTitle.trim() === "") {
      return;
    }

    try {
      const forumRef = await addDoc(collection(db, "forums"), {
        title: forumTitle,
        owner: uid,
        members: [uid],
      });

      // Clear the forum title input and close the modal
      setForumTitle("");
      closeCreateForumModal();
      window.location.reload();
    } catch (error) {
      console.error("Error creating forum: ", error);
    }
  };

  // Fetch forums from Firestore and update the state
  useEffect(() => {
    const fetchForums = async () => {
      try {
        const forumsCollectionRef = collection(db, "forums");
        const forumsSnapshot = await getDocs(forumsCollectionRef);
        const forumsData = forumsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setForums(forumsData);
      } catch (error) {
        console.error("Error fetching forums: ", error);
      }
    };

    fetchForums();
  }, []);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const allPosts = [];

        for (const forum of forums) {
          const postsCollectionRef = collection(
            db,
            "forums",
            forum.id,
            "posts"
          );
          const postsSnapshot = await getDocs(postsCollectionRef);
          const postsData = postsSnapshot.docs.map((doc) => ({
            forumId: forum.id,
            forumTitle: forum.title,
            members: forum.members,

            postId: doc.id,
            ...doc.data(),
          }));
          allPosts.push(...postsData);
        }

        // Sort posts as needed (example: by upvotes)
        allPosts.sort((a, b) => b.upvotes - a.upvotes);

        setPosts(allPosts);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      }
    };

    fetchAllPosts();
  }, [forums]);

  useEffect(() => {
    const fetchUserJoinedForums = async () => {
      try {
        const userJoinedForumsData = [];

        for (const forum of forums) {
          const forumDocRef = doc(db, "forums", forum.id);
          const forumDoc = await getDoc(forumDocRef);

          if (forumDoc.exists()) {
            const forumData = forumDoc.data();
            const currentMembers = forumData.members || [];

            if (currentMembers.includes(uid)) {
              userJoinedForumsData.push(forum);
            }
          }
        }

        setUserJoinedForums(userJoinedForumsData);
      } catch (error) {
        console.error("Error fetching user joined forums: ", error);
      }
    };

    fetchUserJoinedForums();
  }, [uid, forums]);

  useEffect(() => {
    const fetchForums = async () => {
      try {
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      } catch (error) {
        console.error("Error fetching forums: ", error);
      }
    };

    fetchForums();
  }, []);

  const openMyForumsModal = () => {
    setIsMyForumsModalOpen(true);
  };

  // Function to close My Forums modal
  const closeMyForumsModal = () => {
    setIsMyForumsModalOpen(false);
  };
  // Filter forums to show only those owned by the authenticated user
  const userForums = forums.filter((forum) => forum.owner === uid);

  // Initialize filterPost as an empty string
  const [filterPost, setFilterPost] = useState("");

  // Use the filter method to filter posts based on the filterPost value
  const uniqueForumTitles = new Set();
  const filterForums = posts.filter((post) => {
    const lowerCaseTitle = post.forumTitle.toLowerCase();

    // Check if the title is unique before including it in the filtered array
    if (!uniqueForumTitles.has(lowerCaseTitle)) {
      uniqueForumTitles.add(lowerCaseTitle);
      return lowerCaseTitle.includes(filterPost.toLowerCase());
    }

    return false;
  });

  // Handle the search input change
  const handleSearchInputChange = (e) => {
    // Convert the input value to lowercase
    const inputValue = e.target.value.toLowerCase();

    // Update the filterPost state with the lowercase input value
    setFilterPost(inputValue);

    // You might have a setSearchQuery function to update the search query elsewhere
    setSearchQuery(inputValue);
  };

  const [sortBy, setSortBy] = useState("highest"); //sort by highest upvote first

  const fetchSortPosts = async () => {
    try {
      const allPosts = [];

      for (const forum of forums) {
        const postsCollectionRef = collection(db, "forums", forum.id, "posts");
        const postsSnapshot = await getDocs(postsCollectionRef);
        const postsData = postsSnapshot.docs.map((doc) => ({
          forumId: forum.id,
          forumTitle: forum.title,
          members: forum.members,
          postId: doc.id,
          ...doc.data(),
        }));
        allPosts.push(...postsData);
      }

      // Sort posts based on the selected sorting option
      if (sortBy === "highest") {
        allPosts.sort((a, b) => a.upvotes - b.upvotes); // Sort by highest upvote
      } else if (sortBy === "lowest") {
        allPosts.sort((a, b) => b.upvotes - a.upvotes); // Sort by lowest upvote
      } else if (sortBy === "latest") {
        allPosts.sort((a, b) => b.createdAt - a.createdAt); // Sort by latest first
      } else if (sortBy === "oldest") {
        allPosts.sort((a, b) => a.createdAt - b.createdAt); // Sort by oldest first
      }

      setPosts(allPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const handleSortOptionChange = (option) => {
    setSortBy(option);
    fetchSortPosts();
  };

  return (
    <HStack
      backgroundImage={BgImage}
      backgroundRepeat={"no-repeat"}
      backgroundSize={"cover"}
    >
      <Container
        maxW="container.md"
        mt="8"
        border={"1px solid #6899FE"}
        backgroundColor={"white"}
      >
        <Flex
          flexDirection={["column", "column", "row"]}
          justifyContent="space-between"
          alignItems={["center", "center", "flex-start"]}
          mb="0"
          p="3"
          boxShadow="sm"
          borderRadius="md"
          marginTop="20"
        >
          <Box
            display="flex"
            flex={1}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Text
              mb={6}
              fontWeight={"bold"}
              fontSize={"20px"}
              mt={-20}
              color={"#6899FE"}
            >
              Communities
            </Text>

            <HStack>
              <Text
                color={"#6899FE"}
                alignItems={"flex-start"}
                mb={"2.5"}
                fontSize={"15px"}
              >
                Forums
              </Text>
            </HStack>

            <InputGroup w={["100%", "70%", "70%"]}>
              <Input
                placeholder="Search for a forum"
                value={searchQuery}
                size={{ base: "sm", md: "sm" }}
                onChange={handleSearchInputChange}
              />
              <InputRightElement>
                <IconButton
                  icon={<FaSearch />}
                  color="#6899FE"
                  size={{ base: "sm", md: "5px" }}
                  mt={{ base: -2 }}
                  aria-label="Search"
                />
              </InputRightElement>
            </InputGroup>
            <Text
              fontWeight={"bold"}
              fontSize={"12.5px"}
              mt={"15px"}
              mb={"15px"}
            >
              Trending Topics (PLACEHOLDERS FOR NOW)
            </Text>
            <HStack gap={"20px"}>
              <Box
                border={"1px solid black"}
                mb={"15px"}
                borderRadius={"2%"}
                backgroundColor={"#F3F1F1"}
                cursor={"pointer"}
              >
                <Image
                  src={PlaceHolderOne}
                  alt="'placeholder 1"
                  height={"150px"}
                  width={"300px"}
                  border={"0px solid black"}
                  borderRadius={"2%"}
                />
                <Text m={"7.5px 5px"} fontWeight={"bold"}>
                  Kendrick is Drake's dad?
                </Text>
              </Box>
              <Box
                border={"1px solid black"}
                mb={"15px"}
                borderRadius={"2%"}
                backgroundColor={"#F3F1F1"}
                cursor={"pointer"}
              >
                <Image
                  src={PlaceHolderTwo}
                  alt="'placeholder 1"
                  height={"150px"}
                  width={"300px"}
                  border={"0px solid black"}
                  borderRadius={"2%"}
                />
                <Text m={"7.5px 5px"} fontWeight={"bold"}>
                  Musicom REVOLUTIONIZES the Music Industry
                </Text>
              </Box>
              <Box>
                <Image
                  src={NextIndicator}
                  alt="next"
                  cursor={"pointer"}
                  _hover={{ transform: "translateY(1px)" }}
                  // have to add an onClick for this
                ></Image>
              </Box>
            </HStack>
            <Box display="flex" flexDirection="row" justifyContent="center">
              <Button
                color={"#6899FE"}
                backgroundColor={"white"}
                border={"1px solid #6899FE"}
                size="sm"
                _hover={{ transform: "translateY(1px)" }}
                onClick={openCreateForumModal}
              >
                Create Forum
              </Button>
              <Button
                backgroundColor={"#6899FE"}
                color={"white"}
                size="sm"
                _hover={{ transform: "translateY(1px)" }}
                onClick={openMyForumsModal}
                marginLeft="2"
              >
                My Forums
              </Button>
            </Box>
          </Box>
          <Modal
            isOpen={isCreateForumModalOpen}
            onClose={closeCreateForumModal}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Create Forum</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <FormControl>
                  <FormLabel>Forum Name</FormLabel>
                  <Input
                    type="text"
                    value={forumTitle}
                    onChange={(e) => setForumTitle(e.target.value)}
                    placeholder="Enter the forum name"
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={createForum}>
                  Create
                </Button>
                <Button variant="ghost" onClick={closeCreateForumModal}>
                  Cancel
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Flex>

        <Flex alignItems="center" p="4" justifyContent="space-between">
          <Modal isOpen={isMyForumsModalOpen} onClose={closeMyForumsModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>My Forums</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {/* Display user's owned forums */}
                <Text fontWeight="bold">My Owned Forums:</Text>
                {userForums.map((forum) => (
                  <Forum key={forum.id} {...forum} user={authUser.user} />
                ))}

                {/* Display user's joined forums */}
                <Text fontWeight="bold" mt="4">
                  My Joined Forums:
                </Text>
                {userJoinedForums.map((forum) => (
                  <Forum key={forum.id} {...forum} user={authUser.user} />
                ))}
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" onClick={closeMyForumsModal}>
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Flex>
        <HStack mt={-5} ml={"30px"} mb={4}>
          <Menu>
            <MenuButton
              as={Button}
              aria-label="Options"
              text={"Sort By"}
              backgroundColor={"white"}
              _hover={{
                transform: "translateY(1px)",
              }}
              _active={{
                background: SortIcon,
              }}
            >
              <HStack>
                <Text
                  fontWeight={"bold"}
                  fontSize={"12.5px"}
                  textDecor={"underline"}
                  _hover={{ color: "#706d63" }}
                  cursor={"pointer"}
                >
                  Sort By
                </Text>
                <Image src={SortIcon}></Image>
              </HStack>
            </MenuButton>
            <MenuList padding={0} border={"2px solid black"}>
              <MenuItem
                justifyContent={"center"}
                borderBottom={"1px solid black"}
                fontWeight={"500"}
                onClick={() => handleSortOptionChange("latest")}
              >
                Latest
              </MenuItem>
              <MenuItem
                justifyContent={"center"}
                borderBottom={"1px solid black"}
                padding={0}
                fontWeight={"500"}
                onClick={() => handleSortOptionChange("oldest")}
              >
                Oldest
              </MenuItem>
              <MenuItem
                justifyContent={"center"}
                borderBottom={"1px solid black"}
                padding={0}
                fontWeight={"500"}
                onClick={() => handleSortOptionChange("highest")}
              >
                Highest
              </MenuItem>
              <MenuItem
                justifyContent={"center"}
                borderBottom={"1px solid black"}
                padding={0}
                fontWeight={"500"}
                onClick={() => handleSortOptionChange("lowest")}
              >
                Lowest
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
        <Stack spacing="4" mb={"16px"} minHeight={"239px"}>
          {isLoading ? (
            <VStack pb={"300px"}>
              <Loading />
            </VStack>
          ) : (
            filterForums.map((post, index) => (
              <Posts key={index} {...post} isFirstPost={index === 0} />
            ))
          )}
        </Stack>
      </Container>
    </HStack>
  );
}

export default ForumPage;

import React, { useState, useEffect } from "react";
import BgImage from "./forums-bg.svg";
import {
  Avatar,
  Menu,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Container,
  Flex,
  Box,
  Image,
  Divider,
  Text,
  Stack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Center,
  useBreakpointValue,
  HStack,
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
import logo from "Musicom Resources/Collage_Logo_232x80.png";
import logoM from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png";
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
import { useParams } from "react-router-dom";
import { PROTECTED } from "lib/routes";
import { Link } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { useRef } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import UpvoteImg from "./upvote.svg";
import DownvoteImg from "./downvote.svg";
import CommentImg from "./comment.svg";
import ShareImg from "./share.svg";
import OptionsImg from "./options.svg";

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
  key,
  forumId,
  postId,
  user,
  post,
  upvotes,
  comments,
  createdAt,
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

  return (
    <Box p="4" pb={"0"} ml={"20px"} mr={"20px"} mb={"30px"}>
      <Box
        p="4"
        pb={"0"}
        mt={-6}
        ml={"20px"}
        mr={"20px"}
        bg="white"
        borderRadius="lg"
        position="relative"
        border={"1px solid #9F9F9F"}
        boxShadow={"0px 2px 5px #9F9F9F"}
      >
        <Flex alignItems="center" justifyContent="space-between">
          <Box flex="1" ml="4">
            <HStack>
              {/* User DP */}
              <Avatar
                height={"30px"}
                width={"30px"}
                src={user?.avatar !== "" ? user?.avatar : logoM}
              />

              {/* Profile and Date */}
              <Flex
                justifyContent={"center"}
                alignItems={"flex-start"}
                flexDirection={"column"}
                ml={2}
              >
                {/* Profile */}
                <Button
                  color="black"
                  fontSize={"12px"}
                  as={Link}
                  to={`${PROTECTED}/profile/${user}`}
                  variant="link"
                >
                  {user}
                </Button>
                {/* Date */}
                <Text fontSize="8px" color="#9F9F9F" whiteSpace={"nowrap"}>
                  {formattedDate}
                </Text>
              </Flex>

              {isPostOwner && (
                <Flex
                  justifyContent="flex-end"
                  alignItems="center"
                  width="100%"
                >
                  <Menu>
                    <MenuButton
                      mr={"2px"}
                      as={IconButton}
                      background={"white"}
                      backgroundImage={OptionsImg}
                      backgroundRepeat={"no-repeat"}
                      backgroundPosition={"center"}
                      backgroundSize={"20px"}
                      _hover={{
                        background: "white",
                        backgroundImage: `${OptionsImg}`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                    />
                    <MenuList>
                      <MenuItem onClick={handleEditPost}>Edit Post</MenuItem>
                      <MenuItem onClick={handleDeletePost}>
                        Delete Post
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              )}
            </HStack>

            <Text
              m={"5px 0"}
              fontSize={"13px"}
              fontWeight={"bold"}
              color={"red"}
            >
              WE NEED TO FIX MAKING POSTS + HAVING SUBHEADINGS FOR THEM
            </Text>

            <Text fontSize="10px" mb={3} color={"#696969"}>
              {post}
            </Text>
          </Box>
        </Flex>
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
        <HStack spacing="1">
          {/* Upvote */}
          <IconButton
            background={"white"}
            backgroundImage={UpvoteImg}
            backgroundRepeat={"no-repeat"}
            backgroundPosition={"center"}
            backgroundSize={"15px"}
            onClick={handleUpvote}
            _hover={{
              backgroundImage: `${UpvoteImg}`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
          {/* Votes */}
          <Text fontSize="sm" fontWeight="bold" textAlign="center">
            {votes}
          </Text>
          {/* Downvote */}
          <IconButton
            background={"white"}
            backgroundImage={DownvoteImg}
            backgroundRepeat={"no-repeat"}
            backgroundPosition={"center"}
            backgroundSize={"15px"}
            onClick={handleDownvote}
            _hover={{
              backgroundImage: `${DownvoteImg}`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
          {/* Comment */}
          <VStack>
            {/* Comments */}
            <Button
              ml={"20px"}
              background={"white"}
              backgroundImage={CommentImg}
              backgroundRepeat={"no-repeat"}
              backgroundPosition={"center"}
              backgroundSize={"15px"}
              onClick={toggleComments}
              _hover={{
                backgroundImage: `${CommentImg}`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            ></Button>
          </VStack>
          <Text fontSize={"sm"} cursor="pointer">
            {postComments.length}
          </Text>
          {/* Share */}
          <Flex justifyContent="flex-end" alignItems="center" width="100%">
            <IconButton
              background={"white"}
              backgroundImage={ShareImg}
              backgroundRepeat={"no-repeat"}
              backgroundPosition={"center"}
              backgroundSize={"20px"}
              _hover={{
                backgroundImage: `${ShareImg}`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "15px",
              }}
              onClick={() => setShowShare(!showShare)}
            />
          </Flex>
        </HStack>
      </Box>
      {showComments && (
        <Box mt="12px" ml={"20px"} mr={"20px"}>
          {postComments.map((comment, index) => (
            <Comment key={index} {...comment} />
          ))}
          <InputGroup mt="2">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              width="50%"
            />
            <Button
              mt="1"
              ml="3"
              colorScheme="blue"
              size="sm"
              onClick={handleCommentSubmit}
            >
              Comment
            </Button>
          </InputGroup>
        </Box>
      )}
    </Box>
  );
}

function Forums() {
  const authUser = useAuth();

  const uid = authUser.user;
  const { id, title, owner, members, post } = useParams();
  const [forum, setForum] = useState(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [posts, setPosts] = useState([]);

  const isForumOwner = forum?.owner === auth?.currentUser?.uid;

  const [editForumModalOpen, setEditForumModalOpen] = useState(false);
  const [editedForumName, setEditedForumName] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = async (event) => {
    try {
      const file = event.target.files[0];

      if (!file) {
        throw new Error("No file selected");
      }

      const storageRef = ref(getStorage());
      const fileRef = ref(storage, `forumCovers/${id}`); // Storing cover images based on forum ID

      await uploadBytes(fileRef, file);

      const imageUrl = await getDownloadURL(fileRef);
      console.log(imageUrl);

      // Update the Firestore document with the new cover image URL
      const forumDocRef = doc(db, "forums", id);
      await updateDoc(forumDocRef, { coverImageUrl: imageUrl });

      // Update the state to reflect the new cover image URL
      setCoverImage(imageUrl);

      // Optionally, you can provide feedback to the user that the image upload was successful
    } catch (error) {
      console.error("Error uploading image:", error);
      // Optionally, you can also notify the user about the error.
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };
  const handleEditForum = () => {
    setEditedForumName(forum?.title || "");
    setEditForumModalOpen(true);
  };

  const handleSaveEditForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
      await updateDoc(forumDocRef, { title: editedForumName });
      setEditForumModalOpen(false);
      // You might want to update the local state or display a success message
    } catch (error) {
      console.error("Error editing forum name: ", error);
    }
  };

  const handleCancelEditForum = () => {
    setEditForumModalOpen(false);
  };

  const handleDeleteForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
      await deleteDoc(forumDocRef);
    } catch (error) {
      console.error("Error deleting forum: ", error);
    }
  };

  const fetchForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
      const forumDocSnap = await getDoc(forumDocRef);
      if (forumDocSnap.exists()) {
        setForum({ id: forumDocSnap.id, ...forumDocSnap.data() });
      } else {
        console.log("Forum not found");
      }
    } catch (error) {
      console.error("Error fetching forum: ", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const postsCollectionRef = collection(db, "forums", id, "posts");
      const postsSnapshot = await getDocs(postsCollectionRef);
      const postsData = postsSnapshot.docs.map((doc) => ({
        postId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
      postsData.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };
  const fetchForumCover = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
      const forumDocSnap = await getDoc(forumDocRef);
      if (forumDocSnap.exists()) {
        const data = forumDocSnap.data();
        setCoverImage(data.coverImageUrl || null); // Set the cover image URL state
      } else {
        console.log("Forum document not found");
      }
    } catch (error) {
      console.error("Error fetching forum cover: ", error);
    }
  };

  useEffect(() => {
    fetchForum();
    fetchPosts();
    fetchForumCover();
  }, [id]);

  const user = authUser?.user?.username;
  const time = serverTimestamp();
  const createPost = async () => {
    //const content = prompt("Enter your post:");
    try {
      const postsCollectionRef = collection(db, "forums", id, "posts");
      await addDoc(postsCollectionRef, {
        user: user,
        post: newPostContent,
        upvotes: 0,
        comments: 0,
        createdAt: time,
      });

      setPosts([
        ...posts,
        { user: user, post: newPostContent, upvotes: 0, comments: 0 },
      ]);

      setNewPostContent("");
      window.location.reload();
    } catch (error) {
      console.error("Error creating post: ", error);
    }
  };

  const joinForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
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
          setForum({ ...forumData, members: currentMembers });
        }
      }
    } catch (error) {
      console.error("Error joining forum: ", error);
    }
  };

  const leaveForum = async () => {
    try {
      const forumDocRef = doc(db, "forums", id);
      const forumDoc = await getDoc(forumDocRef);

      if (forumDoc.exists()) {
        const forumData = forumDoc.data();
        const currentMembers = forumData.members || [];

        // Check if the user is a member
        if (currentMembers.includes(auth?.currentUser?.uid)) {
          // Remove user's UID from the members array
          const updatedMembers = currentMembers.filter(
            (memberId) => memberId !== auth?.currentUser?.uid
          );

          // Update the members array in the database
          await updateDoc(forumDocRef, { members: updatedMembers });

          // Update the local state to reflect the change
          setForum({ ...forumData, members: updatedMembers });
        }
      }
    } catch (error) {
      console.error("Error leaving forum: ", error);
    }
  };
  const handleUploadCover = () => {
    fileInputRef.current.click(); // Trigger the file input click to select an image
  };

  return (
    <Center
      backgroundImage={BgImage}
      backgroundRepeat={"no-repeat"}
      backgroundSize={"cover"}
    >
      <Container
        maxW="container.md"
        mt="0"
        backgroundColor={"white"}
        minHeight={"720px"}
        pr={0}
        pl={0}
      >
        <Flex
          justifyContent="center"
          alignItems="center"
          mb="0"
          pt="3"
          pr={0}
          pl={0}
          boxShadow="sm"
          borderRadius="md"
          marginTop="25px"
          position="relative"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />
          {isForumOwner && (
            <IconButton
              icon={<FaCamera />} // Use the FaCamera icon for changing the cover image
              variant="ghost"
              backgroundColor={"white"}
              size="sm"
              colorScheme="blue"
              aria-label="Change Cover Image"
              onClick={handleCameraClick} // Open file input when clicked
              position="absolute"
              bottom="4"
              right="4"
            />
          )}
          <Box height="250px" width="100%">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Cover"
                style={{ width: "100%", height: "100%" }}
              /> // Set width to 100% and height to 100% of the parent box
            ) : (
              <Box width="100%" height="100%" bg="gray.200" borderRadius="md" /> // Display placeholder if cover image not available
            )}
          </Box>
        </Flex>

        <Flex justifyContent="center">
          <Text fontSize="30px" fontWeight="bold" color="#6899FE">
            {forum?.title}
          </Text>
          {isForumOwner && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaCog />} // Use the FaCog icon for settings
                variant="ghost"
                size="sm"
                colorScheme="gray"
                ml="2"
              />
              <MenuList>
                <MenuItem onClick={handleEditForum}>Edit Forum</MenuItem>
                <MenuItem onClick={handleDeleteForum}>Delete Forum</MenuItem>
                <MenuItem onClick={handleCameraClick}>
                  Change Forum Cover
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>

        <Flex justifyContent="center">
          <Text fontSize={"sm"} color="grey">
            {forum?.members?.length} members
          </Text>
        </Flex>

        <HStack
          justifyContent="center"
          mb={forum?.members?.includes(auth?.currentUser?.uid) ? "0" : "4"}
          gap={"15px"}
        >
          {forum?.members?.includes(auth?.currentUser?.uid) && (
            <Flex
              justifyContent="space-between"
              boxShadow="sm"
              borderRadius="md"
              marginTop=""
            >
              <InputGroup>
                <Flex flex={1} />
                <Button
                  backgroundColor={"#6899FE"}
                  color={"white"}
                  size="sm"
                  onClick={createPost}
                  ml="0"
                  _hover={{ backgroundColor: "#4569b5" }}
                >
                  Create Post
                </Button>
                <Flex flex={1} />
              </InputGroup>
            </Flex>
          )}
          <Button
            colorScheme={
              forum?.members?.includes(auth?.currentUser?.uid) ? "red" : "blue"
            }
            size="sm"
            mt="3"
            mb="3"
            onClick={
              forum?.members?.includes(auth?.currentUser?.uid)
                ? leaveForum
                : joinForum
            }
          >
            {forum?.members?.includes(auth?.currentUser?.uid)
              ? "Leave Forum"
              : "Join Forum"}
          </Button>

          <Modal isOpen={editForumModalOpen} onClose={handleCancelEditForum}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit Forum Name</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Input
                  value={editedForumName}
                  onChange={(e) => setEditedForumName(e.target.value)}
                  placeholder="Edit forum name..."
                />
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={handleSaveEditForum}>
                  Save
                </Button>
                <Button variant="ghost" onClick={handleCancelEditForum}>
                  Cancel
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </HStack>
        <Center>
          <Divider
            orientation="horizontal"
            mt={"15px"}
            width={"720px"}
            borderColor={"#9F9F9F"}
          />
        </Center>
        <Text
          fontWeight={"bold"}
          fontSize={"12px"}
          mt={"15px"}
          mb={"30px"}
          ml={"55px"}
          textDecor={"underline"}
        >
          Sorted by Latest
        </Text>
        <Stack spacing="4">
          {posts.map((post, index) => (
            <Posts key={index} forumId={id} {...post} />
          ))}
        </Stack>
      </Container>
    </Center>
  );
}

export default Forums;

import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardFooter,
  Center,
  Collapse,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Stack,
  Text,
  Textarea,
  useBreakpointValue,
  useColorMode,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
  UnorderedList,
  ListItem,
  SimpleGrid,
  Avatar as Avatarr,
  AvatarGroup,
} from "@chakra-ui/react";
import Post from "components/post";
import PostsList from "components/post/PostsList";
import {
  getIDfromUsername,
  GetUsername,
  useFollowersCount,
  useFollowUser,
  useUsername,
} from "hooks/users";
import { useUser } from "hooks/users";
import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaRegCalendarAlt } from "react-icons/fa";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
} from "react-icons/fi";
import { useParams, Link } from "react-router-dom";
import { MESSAGEMU, MESSAGEMUSER } from "lib/routes";
import Avatar from "./Avatar";
import { format } from "date-fns";

//import React, { useEffect, useState } from 'react';
import EditProfile from "./EditProfile";
import { useAuth } from "hooks/auth";
import { FiSettings } from "react-icons/fi";
import { Icon } from "@chakra-ui/react";
import { usePosts, useRepostCount } from "hooks/posts";
import PageNotFound from "utils/404Error";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "lib/firebase";
import { collection, addDoc } from "@firebase/firestore";
import { useNotifications } from "hooks/notifications";
import {
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "@firebase/firestore";
import { PROTECTED } from "lib/routes";
import { Carousel } from "react-responsive-carousel";
import { usePortfolio, useUploadPortfolio } from "hooks/portfolio";
import { getMetadata, getStorage, ref } from "firebase/storage";
import { DeleteIcon } from "@chakra-ui/icons";
import Lottie from "lottie-react";
import nodeals from "./nodeals";
import { color } from "framer-motion";

function VideoPlayer({ url }) {
  return (
    <Box
      maxW={{ base: "100%", md: "90%" }}
      mx="auto"
      mt={10}
      objectFit="contain"
      orderRadius="md"
      overflow="hidden"
    >
      <video src={url} width="100%" height="100%" controls />
    </Box>
  );
}

const PromiseRender = ({ urls, getFileType, name }) => {
  const [elements, setElements] = useState([]);
  const [audios, setAudios] = useState([]);

  useEffect(() => {
    const fetchElements = async () => {
      const promises = urls.map((url, index) => {
        return getFileType(url).then((result) => {
          if (result && result.startsWith("image")) {
            return (
              <div key={index}>
                <Image
                  src={url}
                  alt={`Photo ${index + 1}`}
                  objectFit="contain"
                  borderRadius="md"
                  maxHeight={"200px"}
                  minHeight={"100px"}
                  mb="10"
                />
              </div>
            );
          } else if (result && result.startsWith("video")) {
            return (
              <div key={index} style={{ objectFit: "contain" }}>
                <VideoPlayer url={url} />
              </div>
            );
          } else {
            return null;
          }
        });
      });

      const elements = await Promise.all(promises);
      setElements(elements.filter((element) => element !== null));
    };

    fetchElements();
  }, [urls, getFileType]);

  useEffect(() => {
    const fetchAudios = async () => {
      const promises = urls.map((url, index) => {
        return getFileType(url).then((result) => {
          if (result && result.startsWith("audio")) {
            return (
              <div key={index}>
                <audio src={url} controls style={{ paddingBottom: "10vh" }} />
              </div>
            );
          } else {
            return null;
          }
        });
      });

      const audioElements = await Promise.all(promises);
      setAudios(audioElements.filter((element) => element !== null));
    };

    fetchAudios();
  }, [urls, getFileType]);

  return (
    <>
      <Carousel
        showThumbs={false}
        showStatus={false}
        showIndicators={urls.length > 1}
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
        renderIndicator={(onClickHandler, isSelected, index, label) => (
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
        {elements}
      </Carousel>
      <Center>
        <Box mt="10">{audios}</Box>
      </Center>
    </>
  );
};

export const updateUserProfile = async (userId, profileUpdates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, profileUpdates);
    console.log("User profile updated successfully.");
  } catch (error) {
    console.error("Error updating user profile: ", error);
  }
};

function DealItem({ deal, id }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const handleApprove = () => {
    // straight to message
  };
  console.log(deal, id);
  const openMessage = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleDeny = async () => {
    const dealIdToDelete = deal?.id; // Assuming dealToDelete is the document ID or another identifier
    console.log(dealIdToDelete);
    console.log(deal?.id);
    try {
      const requestsRef = collection(
        db,
        user?.businessName ? "businesses" : "users",
        user?.id,
        "requests"
      );
      const dealIdToDelete = deal?.id; // Assuming deal.id is the correct identifier

      console.log(`Attempting to delete document with id: ${dealIdToDelete}`);

      // Get a reference to the specific document in the 'requests' collection
      const dealDocRef = doc(requestsRef, dealIdToDelete);

      // Retrieve the document
      const dealDocSnapshot = await getDoc(dealDocRef);

      // Check if the document exists
      if (dealDocSnapshot.exists()) {
        // Delete the document
        await deleteDoc(dealDocRef);
        console.log(`Deal ${dealIdToDelete} deleted successfully`);
      } else {
        console.log(`No matching document found for deal ${dealIdToDelete}`);
      }
    } catch (error) {
      console.error(`Error deleting deal ${deal?.id}:`, error);
      // Handle the error appropriately
    }
  };

  return (
    <ListItem key={deal.id} mb={4}>
      <Box borderWidth="1px" borderRadius="lg" p={4}>
        <Text>
          <GetUsername userIds={[deal.from]} />
        </Text>
        <HStack mt={2}>
          <Button colorScheme="blue" onClick={openMessage}>
            View Request
          </Button>
          <Button colorScheme="red" onClick={() => handleDeny(deal.from)}>
            Deny
          </Button>
        </HStack>
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Message</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>{deal.message}</Text>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={handleCloseModal}>
                Close
              </Button>
              <Button
                colorScheme="green"
                ml={3}
                onClick={() => {
                  window.location.href = `${PROTECTED}/messages/${[deal.from]}`;
                }}
              >
                Approve
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ListItem>
  );
}

export function DealsComponent({ receivedDeals }) {
  if (!receivedDeals || receivedDeals.length === 0) {
    return (
      <Box height={"100%"} width={"100%"}>
        <Lottie animationData={nodeals} />
      </Box>
    );
  }

  return (
    <>
      <Text fontSize="xl" fontWeight="bold" textAlign="left">
        Requests
      </Text>
      <div
        style={{ maxHeight: "580px", maxWidth: "auto", overflowY: "scroll" }}
      >
        <UnorderedList styleType="none" pl={0}>
          {receivedDeals.map((deal) => (
            <DealItem key={deal.id} deal={deal} id={deal.id} />
          ))}
        </UnorderedList>
      </div>
    </>
  );
}

export function useDeal(userId, authUserId) {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();
  const [dealList, setDealingList] = useState([]);

  const [receivedDeals, setReceivedDeals] = useState([]);

  const fetchReceivedDeals = async () => {
    try {
      if (authUserId) {
        // Logic to fetch received deals
        const dealUserDocRef = doc(collection(db, "users"), authUserId);
        const dealUserDocSnapshot = await getDoc(dealUserDocRef);
        const dealBusinessDocRef = doc(
          collection(db, "businesses"),
          authUserId
        );
        const dealBusinessDocSnapshot = await getDoc(dealUserDocRef);

        if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
          const dealUserDocData = dealUserDocSnapshot.exists()
            ? dealUserDocSnapshot.data()
            : dealBusinessDocSnapshot.exists()
            ? dealBusinessDocSnapshot.data()
            : [];
          const dealsList = dealUserDocData.deals || [];

          // Update received deals state with fetched deals
          setReceivedDeals(dealsList);
        }
      }
    } catch (error) {
      console.error("Error fetching received deals:", error);
      // Handle errors if needed
    }
  };

  useEffect(() => {
    async function checkIsRequested() {
      if (authUserId) {
        const userQuerySnapshot = await getDocs(
          collection(db, "users"),
          where("id", "==", authUserId)
        );
        const businessQuerySnapshot = await getDocs(
          collection(db, "businesses"),
          where("id", "==", authUserId)
        );

        if (
          !userQuerySnapshot.empty &&
          userQuerySnapshot.docs[0].data().dealing
        ) {
          setDealingList(userQuerySnapshot.docs[0].data().dealing);
        } else if (
          !businessQuerySnapshot.empty &&
          businessQuerySnapshot.docs[0].data().dealing
        ) {
          setDealingList(businessQuerySnapshot.docs[0].data().dealing);
        } else {
          setDealingList([]);
        }

        setIsRequested(dealList.includes(userId));
      }
    }

    if (authUserId) {
      fetchReceivedDeals();
      checkIsRequested();
    }
  }, [authUserId, userId]);

  const requestUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, "users"), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      const businessDocRef = doc(collection(db, "businesses"), authUserId);
      const businessDocSnapshot = await getDoc(businessDocRef);

      if (userDocSnapshot.exists() || businessDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        const businessDocData = businessDocSnapshot.data();
        const dealingList =
          userDocSnapshot.exists() && userDocData.dealing
            ? userDocData.dealing
            : businessDocSnapshot.exists() && businessDocData.dealing
            ? businessDocData.dealing
            : [];

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            dealing: [...dealingList, userId],
          });
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(businessDocRef, {
            dealing: [...dealingList, userId],
          });
        }

        const dealUserDocRef = doc(collection(db, "users"), authUserId);
        const dealUserDocSnapshot = await getDoc(dealUserDocRef);
        const dealBusinessDocRef = doc(
          collection(db, "businesses"),
          authUserId
        );
        const dealBusinessDocSnapshot = await getDoc(dealUserDocRef);
        if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
          const dealUserDocData = dealUserDocSnapshot.exists()
            ? dealUserDocSnapshot.data()
            : dealBusinessDocSnapshot.exists()
            ? dealBusinessDocSnapshot.data()
            : [];
          const dealsList = dealUserDocData.deals || [];

          if (dealUserDocSnapshot.exists()) {
            await updateDoc(dealUserDocRef, {
              deals: [...dealsList, authUserId],
            });
          } else if (dealBusinessDocSnapshot.exists()) {
            await updateDoc(dealBusinessDocRef, {
              deals: [...dealsList, authUserId],
            });
          }

          setIsRequested(true);
          setIsLoading(false);

          toast({
            title: "Request Sent",
            status: "success",
            isClosable: true,
            position: "top",
            duration: 5000,
          });
        } else {
          console.error("Deal user document does not exist");
          setIsLoading(false);

          toast({
            title: "Failed to send request",
            description:
              "An error occurred while requesting the user. Please try again.",
            status: "error",
            isClosable: true,
            position: "top",
            duration: 5000,
          });
        }
      } else {
        console.error("User document does not exist");
        setIsLoading(false);

        toast({
          title: "Failed to send deal",
          description:
            "An error occurred while requesting the user. Please try again.",
          status: "error",
          isClosable: true,
          position: "top",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error requesting user:", error);
      setIsLoading(false);

      toast({
        title: "Failed to request user",
        description:
          "An error occurred while requesting the user. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
  };

  const cancelDealUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, "users"), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      const businessDocRef = doc(collection(db, "businesses"), authUserId);
      const businessDocSnapshot = await getDoc(businessDocRef);

      if (userDocSnapshot.exists() || businessDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.exists()
          ? userDocSnapshot.data()
          : businessDocSnapshot.data();
        const dealingList = userDocData.dealing || [];

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            dealing: dealingList.filter((id) => id !== userId),
          });
        } else if (businessDocSnapshot.exists) {
          await updateDoc(businessDocRef, {
            dealing: dealingList.filter((id) => id !== userId),
          });
        }
      }

      const dealUserDocRef = doc(collection(db, "users"), userId);
      const dealUserDocSnapshot = await getDoc(dealUserDocRef);
      const dealBusinessDocRef = doc(collection(db, "businesses"), userId);
      const dealBusinessDocSnapshot = await getDoc(dealBusinessDocRef);

      if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
        const dealUserDocData = dealUserDocSnapshot.exists()
          ? dealUserDocSnapshot.data()
          : dealBusinessDocSnapshot.data();
        const dealsList = dealUserDocData.deals || [];

        if (dealUserDocSnapshot.exists()) {
          await updateDoc(dealUserDocRef, {
            deals: dealsList.filter((id) => id !== authUserId),
          });
        } else if (dealBusinessDocSnapshot.exists()) {
          await updateDoc(dealBusinessDocRef, {
            deals: dealsList.filter((id) => id !== authUserId),
          });
        }
      }

      // Check if notification exists
      const notificationSnapshot = await getDocs(
        query(
          collection(db, "notifications"),
          where("uid", "==", userId),
          where("type", "==", "deal"),
          where("from", "==", authUserId)
        )
      );

      if (!notificationSnapshot.empty) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, "notifications", docSnapshot.id));
        });
      }

      setIsRequested(false);
      setIsLoading(false);
      // await sendNotification({
      //   title: "Deal canceled!",
      //   content: `@${authUser.username} canceled the deal.`,
      //   uid: userId,
      //   from: authUserId,
      //   type: "cancelDeal",
      //   time: Date.now(),
      // });
      toast({
        title: "Deal canceled!",
        status: "success",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    } catch (error) {
      console.error("Error canceling deal:", error);
      setIsLoading(false);

      toast({
        title: "Failed to cancel deal",
        description:
          "An error occurred while canceling the deal. Please try again.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
  };

  return { isRequested, isLoading, requestUser, cancelDealUser, receivedDeals };
}

export function FollowButton({
  userId,
  authUserId,
  isMobile,
  updateFollowersCount,
}) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const { isFollowing: isFollowedBack } = useFollowUser(authUserId, userId); // Check if the target user follows the authenticated user
  const { followersCount } = useFollowersCount(userId); // Get the followers count of the target user
  const toast = useToast();

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount(); // Update followers count after following a user
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount(); // Update followers count after unfollowing a user
  };

  // Adjusted logic to display "Friends" only if both users follow each other
  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;

  return (
    <>
      {isMobile ? (
        <Button
          pos="flex"
          mb="-10"
          ml="auto"
          colorScheme={
            isFriends
              ? "green"
              : isFollowing
              ? "gray"
              : isFollowBack
              ? "blue"
              : "blue"
          }
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
          isLoading={isLoading}
          //rounded="full"
          size="sm"
          display="flex"
        >
          {isFriends
            ? "Friends"
            : isFollowing
            ? "Unfollow"
            : isFollowBack
            ? "Follow Back"
            : "Follow"}
        </Button>
      ) : (
        <Button
          colorScheme={
            isFriends ? "green" : isFollowing || isFollowBack ? "gray" : "blue"
          }
          isLoading={isLoading}
          marginRight={2}
          size={"sm"}
          pl={10}
          pr={10}
          backgroundColor={"#6899fe"}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
        >
          {isFriends
            ? "Friends"
            : isFollowing
            ? "Unfollow"
            : isFollowBack
            ? "Follow Back"
            : "Follow"}
        </Button>
      )}
    </>
  );
}

export function FriendRequestButton({ userId, authUserId }) {
  const [requestState, setRequestState] = useState("none"); // 'none', 'requested', 'cancel'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      // Check if there is an existing request from authUserId to userId
      const sentRequestDoc = doc(
        db,
        "users",
        authUserId,
        "sentRequests",
        userId
      );
      const sentRequestSnapshot = await getDoc(sentRequestDoc);

      if (sentRequestSnapshot.exists()) {
        setRequestState("cancel");
      } else {
        const receivedRequestDoc = doc(
          db,
          "users",
          userId,
          "receivedRequests",
          authUserId
        );
        const receivedRequestSnapshot = await getDoc(receivedRequestDoc);

        if (receivedRequestSnapshot.exists()) {
          setRequestState("requested");
        } else {
          setRequestState("none");
        }
      }
    };

    checkFriendRequestStatus();
  }, [userId, authUserId]);

  const handleSendFriendRequest = async () => {
    setIsLoading(true);
    // im going to adjust to make the pathways just making sure the structure is correct
    const sentRequestDoc = doc(db, "users", authUserId, "sentRequests", userId);
    const receivedRequestDoc = doc(
      db,
      "users",
      userId,
      "receivedRequests",
      authUserId
    );

    await updateDoc(sentRequestDoc, { status: "pending" });
    await updateDoc(receivedRequestDoc, { status: "pending" });

    setRequestState("cancel");
    setIsLoading(false);
  };

  const handleCancelFriendRequest = async () => {
    setIsLoading(true);
    // im going to adjust to make the pathways just making sure the structure is correct
    const sentRequestDoc = doc(db, "users", authUserId, "sentRequests", userId);
    const receivedRequestDoc = doc(
      db,
      "users",
      userId,
      "receivedRequests",
      authUserId
    );

    await deleteDoc(sentRequestDoc);
    await deleteDoc(receivedRequestDoc);

    setRequestState("none");
    setIsLoading(false);
  };

  return (
    <Button
      isLoading={isLoading}
      onClick={() => {
        if (requestState === "none") {
          handleSendFriendRequest();
        } else if (requestState === "cancel") {
          handleCancelFriendRequest();
        }
      }}
      colorScheme={requestState === "cancel" ? "red" : "blue"}
    >
      {requestState === "cancel"
        ? "Cancel Friend Request"
        : "Send Friend Request"}
    </Button>
  );
}

export function MessageRequestButton({
  userId,
  authUserId,
  isMobile,
  updateFollowersCount,
}) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const toast = useToast();
  const { isFollowing: isFollowedBack } = useFollowUser(authUserId, userId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [message, setMessage] = useState("");
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();
  //const history = useHistory();

  const sendMessageRequest = async () => {
    try {
      const userRef = doc(db, "users", userId);

      // Check if the user document exists
      const userSnap = await getDoc(userRef);
      const businessRef = doc(db, "businesses", userId);

      // Check if the user document exists
      const businessSnap = await getDoc(businessRef);

      if (userSnap.exists()) {
        // Create a new collection named "requests" inside the user document
        const requestsCollectionRef = collection(userRef, "requests");

        // Add a new document with the specified structure to the "requests" collection
        await addDoc(requestsCollectionRef, {
          message: message,
          from: authUserId,
        });

        await sendNotification({
          title: "New Request",
          content: `@${authUser.username} sent you a request.`,
          uid: userId,
          from: authUserId,
          type: "request",
          time: Date.now(),
        });

        toast({
          title: "Request sent successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        onClose(); // Close the modal after a successful request
      } else if (businessSnap.exists()) {
        // Create a new collection named "requests" inside the user document
        const requestsCollectionRef = collection(businessRef, "requests");

        // Add a new document with the specified structure to the "requests" collection
        await addDoc(requestsCollectionRef, {
          message: message,
          from: authUserId,
        });

        toast({
          title: "Request sent successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        onClose(); // Close the modal after a successful request
      } else {
        console.error("User document does not exist for userId:", userId);

        toast({
          title: "Error sending request",
          description: "User document not found",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error sending request:", error);

      toast({
        title: "Error sending request",
        description: "Please try again later",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const {
    isRequested,
    isLoading: dealLoading,
    requestUser,
  } = useDeal(userId, authUserId);

  const handleRequestDeal = async () => {
    await requestUser();
  };

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount();
    onClose();
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount();
  };

  const doNothing = async () => {
    // Empty function body
  };
  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;
  return (
    <>
      {isMobile ? (
        <>
          {isFriends || isFollowBack ? (
            <Button
              pos="flex"
              mb="-10"
              ml="auto"
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${userId}`;
              }}
              colorScheme={
                isFriends || isFollowing || isFollowBack ? "blue" : "blue"
              }
              isLoading={isLoading}
              size="sm"
              display="flex"
              backgroundColor={"#6899fe"}
            >
              Message
            </Button>
          ) : (
            <Button
              pos="flex"
              mb="-10"
              ml="auto"
              colorScheme={
                isFriends || isFollowing || isFollowBack ? "blue" : "blue"
              }
              isLoading={isLoading}
              onClick={isFollowBack ? doNothing : onOpen}
              //rounded="full"
              size="md"
              display="flex"
              backgroundColor={"#6899fe"}
            >
              Request
            </Button>
          )}
        </>
      ) : (
        <>
          {isFriends || isFollowBack ? (
            <Button
              colorScheme={
                isFriends || isFollowing || isFollowBack ? "blue" : "blue"
              }
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${userId}`;
              }}
              isLoading={isLoading}
              size="sm"
              pl={10}
              pr={10}
              backgroundColor={"#6899fe"}
            >
              Message
            </Button>
          ) : (
            <Button
              colorScheme={
                isFriends || isFollowing || isFollowBack ? "blue" : "blue"
              }
              isLoading={isLoading}
              size="sm"
              pl={10}
              pr={10}
              onClick={isFollowBack ? doNothing : onOpen}
              backgroundColor={"#6899fe"}
            >
              Request
            </Button>
          )}
        </>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send a Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You can only send one request. Write your request here..."
              size="sm"
              maxLength={300}
            />
          </ModalBody>
          <Text ml="6" size="sm">
            Characters remaining: {300 - message.length}
          </Text>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                sendMessageRequest();
                onClose();
              }}
            >
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function FollowingModal({ isOpen, onClose, following }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Following</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <GetUsername userIds={following} />
        </ModalBody>
        <ModalFooter>
          {/* Add any additional footer content or buttons if needed */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
function FollowersModal({ isOpen, onClose, followers }) {
  const uniqueFollowers = Array.from(new Set(followers));
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Followers</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <GetUsername userIds={uniqueFollowers} />
        </ModalBody>
        <ModalFooter>
          {/* Add any additional footer content or buttons if needed */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function MutualFollowersModal({
  isOpen,
  onClose,
  followers,
  following,
  currentUserId,
}) {
  // Compute mutual followers
  const mutualFollowers = followers.filter(
    (follower) => following?.includes(follower) && follower !== currentUserId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Mutual Followers</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {mutualFollowers.length > 0 ? (
            <GetUsername userIds={mutualFollowers} />
          ) : (
            <Text>No mutual followers</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

const MutualAvatar = ({ mutualID }) => {
  const { user, isLoading } = useUser(mutualID);
  if (isLoading) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  if (!user) {
    return <div>User not found</div>; // Handle user not found scenario
  }

  // Assuming `user` has an `avatar` URL and a `username`
  return (
    <Avatarr
      size="sm"
      src={user.avatar}
      // Prevent pointer events if you want to disable clicking or interaction
      style={{ pointerEvents: "none" }}
    />
  );
};

export default function Profile({ followers }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { username } = useParams();

  const [id, setID] = useState(null);
  const { user, isLoading: userLoading } = useUsername(username);

  const [isProfileLocked, setProfileLocked] = useState(false); // New state for profile lock

  const [isFriend, setIsFriend] = useState(false); // New state for friend status
  const { isFollowing } = useFollowUser(user?.id, authUser?.id);
  const { isFollowing: isFollowedBack } = useFollowUser(authUser?.id, user?.id);
  const onClose = (updatedPortfolio) => {
    // Close the modal
    portfolioClose();
    // Refresh the page
    window.location.reload();
  };

  const {
    isOpen: portfolioOpen,
    onOpen: onPortfolioOpen,
    onClose: portfolioClose,
  } = useDisclosure();

  const { uploadFiles, isLoading: uploadLoading } = useUploadPortfolio();
  const [newFiles, setNewFiles] = useState([]);
  const [newDescription, setNewDescription] = useState("");
  const [newUrls, setNewUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [editingPortfolioIndex, setEditPortfolioIndex] = useState(false);

  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;

  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false);

  const handleOpenMutualModal = () => setIsMutualModalOpen(true);
  const handleCloseMutualModal = () => setIsMutualModalOpen(false);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const supportedFiles = Array.from(files).filter(
          (file) =>
            !file.deleted &&
            (file.type.startsWith("image/") ||
              file.type.startsWith("video/") ||
              file.type.startsWith("audio/"))
        );

        if (supportedFiles.length > 0) {
          const uploadedFiles = await uploadFiles(supportedFiles);
          const uploadedUrls = uploadedFiles.map((file) => file.url);
          setNewUrls((prevUrls) => [...prevUrls, ...uploadedUrls]);
          setNewFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
          setFiles(uploadedFiles);
        }
      } catch (error) {
        console.error("Error uploading files:", error);
        // Handle error, show error message to the user, etc.
      }
    }
  };

  const handleDescriptionChange = (event) => {
    setNewDescription(event.target.value);
  };

  const handleEditPortfolio = (item, index) => {
    // setEditedDescription(portfolios[0]?.description || "");
    setEditPortfolioIndex(true);
    onEditOpen();
  };

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onCloseEditPortfolio,
  } = useDisclosure();

  const handleDeleteFileSelected = async (index) => {
    if (editingPortfolioIndex === true) {
      // Delete the file from storage and Firestore

      try {
        const fileToDelete = portfolios[0].ids[index];

        if (
          !fileToDelete.deleted &&
          fileToDelete.type !== "application/octet-stream"
        ) {
          const fileTODeleteArr = { id: fileToDelete };
          await handleDeleteFile(fileTODeleteArr);
        }
      } catch (error) {
        console.error("Error deleting file:", error);

        return;
      }

      const updatedPortfolioo = [...portfolios];
      updatedPortfolioo[0].url.splice(index, 1);
      updatedPortfolioo[0].name.splice(index, 1);
      updatedPortfolioo[0].ids.splice(index, 1);
    } else {
      // Remove the file URL from newUrls
      setNewUrls((prevUrls) => {
        const updatedUrls = [...prevUrls];
        updatedUrls.splice(index, 1);
        return updatedUrls;
      });

      // Remove the file object from newFiles
      setNewFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles.splice(index, 1);
        return updatedFiles;
      });
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles.splice(index, 1);
        return updatedFiles;
      });

      await handleDeleteFile(files[index]);
    }
  };

  const handleCreatePortfolio = () => {
    onPortfolioOpen();
  };

  const handleSavePortfolioItem = async () => {
    try {
      // Create a new portfolio item
      const newItem = {
        description: newDescription,
        url: newFiles.map((file) => file.url),
        name: newFiles.map((file) => file.name),
        ids: newFiles.map((file) => file.id),
      };

      // Update the portfolio with the new item
      const updatedPortfolio = [...portfolios, newItem];

      // Save the updated portfolio in the database
      if (updatedPortfolio) {
        await updatePortfolioInDatabase(updatedPortfolio);
        // setPortfolio(updatedPortfolio);
        toast({
          title: "Portfolio saved",
          description: "Your portfolio has been successfully saved.",
          status: "success",
          position: "top",
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.error("Invalid portfolio data");
        toast({
          title: "Error",
          description: "An error occurred while saving your portfolio.",
          status: "error",
          position: "top",
          duration: 5000,
          isClosable: true,
        });
      }
      // Reset the form fields
      setNewDescription("");
      setNewUrls([]);
      setFiles([]);
      onClose(updatedPortfolio);
      setEditPortfolioIndex(null);
    } catch (error) {
      console.error("Error saving portfolio item:", error);
      // Handle error, show error message to the user, etc.
    }
  };

  const onCloseEdit = (updatedPortfolio) => {
    // Close the modal
    onCloseEditPortfolio();
    setEditPortfolioIndex(null);
    setNewFiles([]);
  };

  const handleDeletePortfolio = async () => {
    try {
      // Delete files in the portfolio
      await handleDeleteFiles(portfolios[0].ids);

      // Delete portfolio from Firestore
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        portfolio: "",
      });
      window.location.reload();

      // Optional: You can show a success message or redirect the user after deleting the portfolio
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      // Optional: You can show an error message if deleting the portfolio fails
    }
  };

  const [editedDescription, setEditedDescription] = useState("");

  const handleSaveEdit = () => {
    // Logic for saving the edited description
    try {
      const updatedPortfolioCopy = portfolios.map((item, index) => {
        item.url.push(
          ...(newFiles?.map((file) => file.url) || portfolios[0].url)
        );
        item.name.push(
          ...(newFiles?.map((file) => file.name) || portfolios[0].name)
        );
        item.ids.push(
          ...(newFiles?.map((file) => file.id) || portfolios[0].ids)
        );
        item.description = editedDescription || portfolios[0].description;
        return item;
      });

      updatePortfolioInDatabase(updatedPortfolioCopy);
      setEditPortfolioIndex(null);
      onCloseEdit(updatedPortfolioCopy);
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while editing your portfolio.",
        status: "error",
        position: "top",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error updating portfolio:", error);
    }
  };

  const getFileType = async (url) => {
    try {
      const storage = getStorage(); // Initialize Firebase Storage

      const fileRef = ref(storage, url);
      const metadata = await getMetadata(fileRef);
      return metadata.contentType;
    } catch (error) {
      console.error("Error getting file type:", error);
      return null;
    }
  };

  const { isOpen: openPortfolio, onToggle } = useDisclosure();
  const toast = useToast();
  const [isPortfolioOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    async function fetchUserID() {
      try {
        const id = await getIDfromUsername(username);
        setID(id);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    }

    fetchUserID();
  }, [username]);

  const {
    portfolio: portfolios,
    isLoading: portfolioLoading,
    updatePortfolioInDatabase,
    handleDeleteFile,
    handleDeleteFiles,
  } = usePortfolio(user?.id || id);

  useEffect(() => {
    if (user && user.id) {
      // Check if user and user.id are not null or undefined
      const userRef = doc(db, "users", user.id);
      const businessRef = doc(db, "businesses", user.id);
      if (!user.businessName) {
        const unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const storedProfileLock = userData?.isProfileLocked; // Use optional chaining here
            if (storedProfileLock !== undefined) {
              setProfileLocked(storedProfileLock);
            }
          }
        });
        return () => {
          unsubscribeUser();
        };
      } else {
        const unsubscribeBusiness = onSnapshot(businessRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const businessData = docSnapshot.data();
            const storedProfileLock = businessData?.isProfileLocked; // Use optional chaining here
            if (storedProfileLock !== undefined) {
              setProfileLocked(storedProfileLock);
            }
          }
        });
        return () => {
          unsubscribeBusiness();
        };
      }
    }
    return;
  }, [user]);

  useEffect(() => {
    let unsubscribe = () => {};

    if (user && user.id) {
      const userRef = doc(db, "users", user.id);

      unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setProfileLocked(userData.isProfileLocked);
        }
      });
    }

    return () => unsubscribe();
  }, [user, db]);

  const { posts, isLoading: postsLoading } = usePosts(id);
  const { isOpen, onOpen, onClose: onCloseModal } = useDisclosure();
  //const { user: authUser, isLoading: authLoading } = useAuth();
  const {
    count: followersCount,
    isLoading: followersLoading,
    updateFollowersCount,
  } = useFollowersCount(user?.id);
  var likeCount = 0;
  if (Array.isArray(posts)) {
    posts.forEach((post) => {
      if (Array.isArray(post.likes)) {
        likeCount += post.likes.length;
      }
    });
  }

  const handleToggleProfileLock = async () => {
    if (authUser.id === user.id) {
      const newProfileLockState = !isProfileLocked;
      setProfileLocked(newProfileLockState);

      try {
        // Update the profile lock state in the database
        const userRef = doc(db, "users", user.id);
        const businessRef = doc(db, "businesses", user.id);
        const userDocSnapshot = await getDoc(userRef);
        const businessDocSnapshot = await getDoc(businessRef);
        if (userDocSnapshot.exists()) {
          await updateDoc(
            userRef,
            { isProfileLocked: newProfileLockState },
            { merge: true }
          );
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(
            businessRef,
            { isProfileLocked: newProfileLockState },
            { merge: true }
          );
        }
      } catch (error) {
        console.log("Error updating profile lock state:", error);
      }
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const [isModalOpenFollowers, setIsModalOpenFollowers] = useState(false);
  const handleOpenModalFollowers = () => {
    setIsModalOpenFollowers(true);
  };

  const handleCloseModalFollowers = () => {
    setIsModalOpenFollowers(false);
  };
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode();

  if (userLoading || postsLoading || followersLoading) return "Loading...";
  const uniqueFollowers = Array.from(new Set(user?.followers));

  const handleTogglePrivacy = async () => {
    if (user && user.id) {
      const userRef = doc(db, "users", user.id);

      try {
        await updateDoc(userRef, {
          isProfileLocked: !isProfileLocked,
        });
        console.log("Profile privacy updated successfully.");
      } catch (error) {
        console.error("Error updating profile privacy:", error);
      }
    }
  };

  const handleShowFollowers = () => {
    if (
      user.isProfileLocked &&
      authUser.id !== user.id &&
      !isFriends &&
      !isFollowBack
    ) {
      toast({
        title: "Private Account",
        description: "This user has a private account.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } else {
      setIsModalOpenFollowers(true);
    }
  };

  const handleShowFollowing = () => {
    if (
      user.isProfileLocked &&
      authUser.id !== user.id &&
      !isFriends &&
      !isFollowBack
    ) {
      toast({
        title: "Private Account",
        description: "This user has a private account.",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } else {
      setIsModalOpen(true);
    }
  };

  const mutualFollowers =
    uniqueFollowers?.length > 0 && user?.following?.length > 0
      ? uniqueFollowers.filter(
          (follower) =>
            user?.following?.includes(follower) && follower !== authUser.id
        )
      : [];

  // Limit to first three mutual followers
  const firstThreeMutuals = mutualFollowers.slice(0, 3);

  if (user) {
    return (
      <Box pt={20} pl={{ base: "", md: "60" }} width="100%">
        <VStack spacing={6} align="center" maxW="container.lg">
          <Flex direction={["column", "row"]} align="start">
            {/* {isMobile && authUser.id === user.id && (
              <Button
                pos="flex"
                mb="-10"
                ml={{ base: "auto", md: "auto" }}
                right="auto"
                mr={isMobile ? "-5" : "0"}
                colorScheme="blue"
                onClick={onOpen}
                rounded={{ base: "full", md: "md" }}
                size="sm"
                display={{ base: "flex", md: "flex" }}
              >
                {isMobile ? (
                  <Icon as={FiSettings} boxSize={4} />
                ) : (
                  <Text>Change Avatar</Text>
                )}
              </Button>
            )} */}
            <VStack ml={isMobile ? "-5" : "0"}>
              <Flex direction="row">
                <Flex direction={!isMobile ? "column" : "row"}>
                  <Avatar
                    size={isMobile ? "xl" : "xl"}
                    user={user}
                    post={false}
                  />
                  <Flex ml={isMobile ? 5 : 0} direction={"column"}>
                    <Text fontSize="xl" fontWeight="bold">
                      {user?.username}
                    </Text>
                    <Text
                      fontSize="md"
                      fontWeight="medium"
                      color={colorMode === "light" ? "gray.600" : "white"}
                    >
                      {user?.fullName}
                    </Text>
                    {user?.location && (
                      <Flex key={user?.location} align="center">
                        <FaMapMarkerAlt size={10} color="gray.600" />
                        <Text ml={2} fontSize={isMobile ? "2xs" : "sm"}>
                          {user?.location !== ""
                            ? user?.location
                            : "Everywhere"}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                  {/* {user?.portfolio && (
                    <Button
                      mt={3}
                      onClick={onToggle}
                      colorScheme="blue"
                      size={"sm"}
                    >
                      {!openPortfolio ? "Open Portfolio" : "Close Portfolio"}
                    </Button>
                  )} */}
                </Flex>
              </Flex>

              {/* <Box ml={-3} boxShadow="lg"> */}
              <Flex align={"center"} direction="row" mt="5" ml="3" mb="15">
                {isMobile && !authLoading && authUser.id === user.id && (
                  <Button
                    colorScheme="blue"
                    onClick={onOpen}
                    size="sm"
                    mr={2}
                    backgroundColor={"#6899fe"}
                  >
                    Edit Profile
                  </Button>
                )}
                {isMobile && !authLoading && authUser.id !== user.id && (
                  <FollowButton
                    userId={user.id}
                    authUserId={authUser.id}
                    isMobile={isMobile}
                    updateFollowersCount={updateFollowersCount}
                  />
                )}
                <Box ml={2}></Box>
                {isMobile && !authLoading && authUser.id !== user.id && (
                  <MessageRequestButton
                    userId={user.id}
                    authUserId={authUser.id}
                    isMobile={isMobile}
                  />
                )}
                <Box ml={2}></Box>
                {isMobile && user?.portfolio && (
                  <Button
                    // ml={3}
                    mt={10}
                    onClick={onToggle}
                    colorScheme="blue"
                    size={"sm"}
                    backgroundColor={"#6899fe"}
                  >
                    {!openPortfolio ? "Open Portfolio" : "Close Portfolio"}
                  </Button>
                )}
              
              </Flex>
              <Flex align={"center"} ml={1}> {isMobile && portfolios && portfolios.length > 0 ? (
                  <>
                    <Collapse in={openPortfolio} animateOpacity>
                      <Center>
                        <Card maxW="md" align="center">
                          <Heading size="sm" 
                          ml={2} mt={2} mb={-5}>
                            Portfolio
                          </Heading>
                          <Wrap spacing={4}>
                            {portfolios.map(
                              (item, index) =>
                                authUser.id === user.id && (
                                  <ButtonGroup spacing="2">
                                    <Button
                                      size={"xs"}
                                      colorScheme="gray"
                                      onClick={() => handleEditPortfolio(item)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      ml="10"
                                      size={"xs"}
                                      colorScheme="gray"
                                      onClick={() => handleDeletePortfolio()}
                                    >
                                      Delete Portfolio
                                    </Button>
                                  </ButtonGroup>
                                )
                            )}
                            {portfolios.map((item, index) => (
                              <WrapItem key={index}>
                                <Box mb={-20} mt={2}>
                                  <PromiseRender
                                    urls={item.url}
                                    getFileType={getFileType}
                                    name={item.name}
                                  />
                                  {/* <Stack spacing="3" ml="2" mt={-28}>
                                <Text fontSize={"xs"}>{item.description}</Text>
                              </Stack> */}
                                  {/* <CardFooter mt={-28}>
                                
                              </CardFooter> */}
                                </Box>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Card>
                      </Center>
                    </Collapse>
                  </>
                ) : authUser.username === username &&
                  !authUser.businessName &&
                  isMobile ? (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleCreatePortfolio}
                  >
                    Create Portfolio
                  </Button>
                ) : (
                  <></>
                )}</Flex>
            </VStack>

            <Box w={"10"} ml={10} mr={10}></Box>
            {isMobile && user?.bio && (
              <Flex
                align="center"
                p={2}
                // ml={15}
                mb={5}
                mt={10}
                style={{ border: "0.5px solid gray", width: "100%" }}
                rounded={"md"}
              >
                <Text fontSize={isMobile ? "xs" : "sm"} fontWeight={"bold"}>
                  {user?.bio}
                </Text>
              </Flex>
            )}
            <HStack>
              <VStack>
                <HStack spacing={isMobile ? 0 : 10}>
                  <Flex align="center">
                    <VStack>
                      <Text>Posts</Text>
                      <Text ml="2" fontWeight="bold">
                        {posts && posts.length}
                      </Text>
                    </VStack>
                  </Flex>
                  <Flex
                    align="center"
                    pl="5"
                    onClick={() => {
                      handleShowFollowers();
                    }}
                  >
                    <VStack>
                      <Text>Followers</Text>
                      <Text ml="2" fontWeight="bold">
                        {uniqueFollowers.length}
                      </Text>
                    </VStack>
                  </Flex>
                  <Flex
                    align="center"
                    pl="5"
                    onClick={() => {
                      handleShowFollowing();
                    }}
                  >
                    <VStack>
                      <Text>Following</Text>
                      <Text ml="2" fontWeight="bold">
                        {user?.following ? user?.following?.length : "0"}
                      </Text>
                    </VStack>
                  </Flex>
                </HStack>
                <FollowingModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  following={user?.following}
                />
                <FollowersModal
                  isOpen={isModalOpenFollowers}
                  onClose={handleCloseModalFollowers}
                  followers={user?.followers}
                />
               <Flex align={"center"} direction="row" mt="5" ml="3" mb="15">
                {!isMobile && !authLoading && authUser.id === user.id && (
                  <Button
                    colorScheme="blue"
                    onClick={onOpen}
                    size="sm"
                    mr={2}
                    mt={3}
                    backgroundColor={"#6899fe"}
                  >
                    Edit Profile
                  </Button>
                )}
                {!isMobile && !authLoading && authUser.id !== user.id && (
                  <FollowButton
                    userId={user.id}
                    authUserId={authUser.id}
                    isMobile={isMobile}
                    updateFollowersCount={updateFollowersCount}
                  />
                )}
                <Box ml={2}></Box>
                {!isMobile && !authLoading && authUser.id !== user.id && (
                  <MessageRequestButton
                    userId={user.id}
                    authUserId={authUser.id}
                    isMobile={isMobile}
                  />
                )}
               <Box ml={2}></Box>
              {!isMobile && !authLoading && authUser.id === user.id && user?.portfolio && (
                  <Button
                    mt={3}
                    onClick={openModal}
                    colorScheme="blue"
                    size={"sm"}
                    backgroundColor={"#6899fe"}
                  >
                    {!openPortfolio ? "Open Portfolio" : "Close Portfolio"}
                  </Button>
                )}
              </Flex>

                {!isMobile && !authLoading && authUser.id !== user.id && user?.portfolio && (
                  <Button
                    mt={3}
                    onClick={openModal}
                    colorScheme="blue"
                    size={"sm"}
                    backgroundColor={"#6899fe"}
                  >
                    {!openPortfolio ? "Open Portfolio" : "Close Portfolio"}
                  </Button>
                )}

                <Box
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                

{!isMobile && portfolios && portfolios.length > 0 ? (
        <>
        
          <Modal isOpen={isPortfolioOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent maxW="md">
              <ModalHeader>Portfolio</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Center>
                  <Card align="center" w="full">
                    <Wrap spacing={4}>
                      {portfolios.map(
                        (item, index) =>
                          authUser.id === user.id && (
                            <ButtonGroup key={index} spacing="2">
                              <Button
                                size={"xs"}
                                colorScheme="gray"
                                onClick={() => handleEditPortfolio(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size={"xs"}
                                colorScheme="gray"
                                onClick={() => handleDeletePortfolio()}
                              >
                                Delete Portfolio
                              </Button>
                            </ButtonGroup>
                          )
                      )}
                      {portfolios.map((item, index) => (
                        <WrapItem key={index}>
                          <Box mb={2} mt={2}>
                            <PromiseRender
                              urls={item.url}
                              getFileType={getFileType}
                              name={item.name}
                            />
                          </Box>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Card>
                </Center>
              </ModalBody>
              <ModalFooter>
                <Button onClick={closeModal}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      )  : authUser.username === username &&
                    !authUser.businessName &&
                    !isMobile ? (
                    <Button colorScheme="blue" onClick={handleCreatePortfolio}>
                      Create Portfolio
                    </Button>
                  ) : (
                    <></>
                  )}
                </Box>
                <Modal isOpen={portfolioOpen} onClose={portfolioClose}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Create Portfolio Item</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      <VStack spacing={4} align="start">
                        {/* <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      placeholder="Enter description"
                      value={newDescription}
                      onChange={handleDescriptionChange}
                    />
                  </FormControl> */}
                        <FormControl>
                          <FormLabel>Upload Image, Videos or Audios</FormLabel>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            accept="image/*,audio/*,video/*"
                          />
                          {newFiles.map((file, index) => (
                            <Flex key={index} align="center" mt={2}>
                              <Text>{file.name}</Text>
                              <IconButton
                                ml={2}
                                aria-label="Delete File"
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteFileSelected(index)}
                              />
                            </Flex>
                          ))}
                        </FormControl>
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        colorScheme="blue"
                        mr={3}
                        onClick={handleSavePortfolioItem}
                      >
                        Save
                      </Button>
                      <Button variant="ghost" onClick={onClose}>
                        Cancel
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
                <Modal isOpen={isEditOpen} onClose={onCloseEdit}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader>Edit Portfolio Item</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                      {/* <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Enter description"
                  />
                </FormControl> */}
                      <FormControl>
                        <FormLabel>Uploaded Files</FormLabel>
                        {portfolios.map((por, index) => (
                          <Wrap key={index}>
                            {Array.isArray(por.name) ? (
                              por.name.map((name, inde) => (
                                <Flex key={inde} align="center" mt={2}>
                                  <Text>{name}</Text>
                                  <IconButton
                                    ml={2}
                                    aria-label="Delete File"
                                    icon={<DeleteIcon />}
                                    onClick={() =>
                                      handleDeleteFileSelected(inde)
                                    }
                                  />
                                </Flex>
                              ))
                            ) : (
                              <Text>No names available</Text>
                            )}
                          </Wrap>
                        ))}
                        {newFiles.map((file, index) => (
                          <Flex key={index} align="center" mt={2}>
                            <Text>{file.name}</Text>
                            <IconButton
                              ml={2}
                              aria-label="Delete File"
                              icon={<DeleteIcon />}
                              onClick={() => handleDeleteFileSelected(index)}
                            />
                          </Flex>
                        ))}
                      </FormControl>
                      <FormControl>
                        <FormLabel>Add Files</FormLabel>
                        <Input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          accept="image/*,audio/*,video/*"
                        />
                      </FormControl>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        colorScheme="blue"
                        mr={3}
                        onClick={handleSaveEdit}
                      >
                        Save Changes
                      </Button>
                      <Button variant="ghost" onClick={onCloseEdit}>
                        Cancel
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                <VStack ml={15} align="start" paddingTop={10}>
                  {user?.locations?.flatMap((address) => {
                    if (address?.Addresses) {
                      return address?.Addresses.map((location, index) => (
                        <Flex key={index} align="center">
                          <FaMapMarkerAlt size={10} color="gray.600" />
                          <Text ml={2} fontSize={isMobile ? "2xs" : "sm"}>
                            {location.address !== ""
                              ? location.address
                              : "Everywhere"}
                          </Text>
                        </Flex>
                      ));
                    }
                  })}
                </VStack>

                {/* // address?.Addresses?.map((location) => (
                    
                // ))}
                // ) : user?.locations?.Addresses ? (
                //   user?.locations?.Addresses.some((location) => {
                //     return (
                //       <Flex align="center">
                //         <FaMapMarkerAlt size={10} color="gray.600" />
                //         <Text ml={2} fontSize={isMobile ? "2xs" : "sm"}>
                //           {location.address !== ""
                //             ? location.address
                //             : "Everywhere"}
                //         </Text>
                //       </Flex>
                //     );
                //   })
                // ) : (
                //   <Flex align="center">
                //     <FaMapMarkerAlt size={10} color="gray.600" />
                //     <Text>Wrong</Text>
                //     <Text ml={2} fontSize={"sm"}>
                //       {user?.location !== "" ? user.location : "Everywhere"}
                //     </Text>
                //   </Flex>
                // )} */}
                {isMobile && (
                  <VStack
                    spacing={2}
                    align="start"
                    ml={10}
                    style={{
                      border: "0.5px solid gray",
                      width: isMobile ? "110%" : "",
                    }}
                    rounded={"md"}
                    padding={2}
                  >
                    {user?.role && (
                      <Flex direction="row">
                        {user?.role && (
                          <>
                            <Text
                              fontSize={isMobile ? "2xs" : "sm"}
                              fontWeight={"bold"}
                            >
                              Role:
                            </Text>
                            <Wrap ml="1" mt={isMobile ? 0 : 0.5}>
                              <WrapItem key={user?.role} mr="1">
                                <Text
                                  variant="subtle"
                                  color="#2e69a7"
                                  fontSize={isMobile ? "2xs" : "xs"}
                                >
                                  {user?.role.toUpperCase()}
                                </Text>
                              </WrapItem>
                            </Wrap>
                          </>
                        )}
                      </Flex>
                    )}

                    {/* <Flex align="center">
                <FaRegCalendarAlt size={16} color="gray.600" />
                <Text ml={2}>{format(user?.date, "MMMM YYY")}</Text>
              </Flex> */}
                    {user?.instrument && (
                      <Wrap direction="row">
                        {user?.instrument ? (
                          user?.instrument.length > 0 && (
                            <>
                              <Text
                                fontSize={isMobile ? "2xs" : "sm"}
                                fontWeight={"bold"}
                              >
                                Instruments:
                              </Text>
                              <Wrap ml="2" mt={0.5}>
                                {user?.instrument.map((instrument, index) => (
                                  <WrapItem key={index} mr="1">
                                    <Text
                                      mt={isMobile ? 0 : 0.5}
                                      variant="subtle"
                                      color="#2e69a7"
                                      fontSize={isMobile ? "2xs" : "xs"}
                                    >
                                      {instrument.toUpperCase()}
                                    </Text>
                                  </WrapItem>
                                ))}
                              </Wrap>
                            </>
                          )
                        ) : (
                          <></>
                        )}
                      </Wrap>
                    )}

                    {user?.genres ? (
                      user?.genres.length > 0 && (
                        <Flex direction="row">
                          <Text
                            fontSize={isMobile ? "2xs" : "sm"}
                            fontWeight={"bold"}
                          >
                            Genres:{" "}
                          </Text>
                          <Wrap ml="2" mt={0.5}>
                            {user?.genres.map((genre, index) => (
                              <WrapItem key={index} mr="1">
                                <Text
                                  variant="subtle"
                                  color="#2e69a7"
                                  fontSize={isMobile ? "2xs" : "xs"}
                                >
                                  {genre.toUpperCase()}
                                </Text>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Flex>
                      )
                    ) : (
                      <></>
                    )}
                    {user?.signed && (
                      <Flex direction="row">
                        {user?.signed && (
                          <>
                            <Text
                              fontSize={isMobile ? "2xs" : "sm"}
                              fontWeight={"bold"}
                            >
                              Signed:
                            </Text>
                            <Wrap ml="1">
                              <Text fontSize={isMobile ? "2xs" : "sm"}>
                                {user?.signed ? "Yes" : "No"}
                              </Text>
                            </Wrap>
                          </>
                        )}
                      </Flex>
                    )}
                    {user?.languages &&
                      Array.isArray(user.languages) &&
                      user.languages.length > 0 && (
                        <Flex direction="row">
                          <>
                            <Text
                              fontSize={isMobile ? "2xs" : "sm"}
                              fontWeight={"bold"}
                            >
                              Languages:
                            </Text>
                            <Wrap ml="2" mt={0.5}>
                              {user.languages.map((language, index) => (
                                <WrapItem key={index} mr="1">
                                  <Text
                                    variant="subtle"
                                    color="#2e69a7"
                                    fontSize={isMobile ? "2xs" : "xs"}
                                  >
                                    {language.toUpperCase()}
                                  </Text>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </>
                        </Flex>
                      )}
                  </VStack>
                )}
                {!isMobile && user?.bio && (
                  <Flex
                    align="center"
                    p={2}
                    ml={15}
                    style={{ border: "0.5px solid gray", width: "100%" }}
                    rounded={"md"}
                  >
                    <Text fontSize={isMobile ? "xs" : "sm"} fontWeight={"bold"}>
                      {user?.bio}
                    </Text>
                  </Flex>
                )}
              </VStack>
              {!isMobile && (
                <VStack
                  spacing={2}
                  align="start"
                  ml={20}
                  style={{
                    border: "0.5px solid gray",
                    width: isMobile ? "110%" : "",
                  }}
                  rounded={"md"}
                  padding={2}
                >
                  {user?.role && (
                    <Flex direction="row">
                      {user?.role && (
                        <>
                          <Text
                            fontSize={isMobile ? "2xs" : "sm"}
                            fontWeight={"bold"}
                          >
                            Role:
                          </Text>
                          <Wrap ml="1" mt={isMobile ? 0 : 0.5}>
                            <WrapItem key={user?.role} mr="1">
                              <Text
                                variant="subtle"
                                color="#2e69a7"
                                fontSize={isMobile ? "2xs" : "xs"}
                              >
                                {user?.role.toUpperCase()}
                              </Text>
                            </WrapItem>
                          </Wrap>
                        </>
                      )}
                    </Flex>
                  )}

                  {/* <Flex align="center">
                <FaRegCalendarAlt size={16} color="gray.600" />
                <Text ml={2}>{format(user?.date, "MMMM YYY")}</Text>
              </Flex> */}
                  {user?.instrument && (
                    <Wrap direction="row">
                      {user?.instrument ? (
                        user?.instrument.length > 0 && (
                          <>
                            <Text
                              fontSize={isMobile ? "2xs" : "sm"}
                              fontWeight={"bold"}
                            >
                              Instruments:
                            </Text>
                            <Wrap ml="2" mt={0.5}>
                              {user?.instrument.map((instrument, index) => (
                                <WrapItem key={index} mr="1">
                                  <Text
                                    mt={isMobile ? 0 : 0.5}
                                    variant="subtle"
                                    color="#2e69a7"
                                    fontSize={isMobile ? "2xs" : "xs"}
                                  >
                                    {instrument.toUpperCase()}
                                  </Text>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </>
                        )
                      ) : (
                        <></>
                      )}
                    </Wrap>
                  )}

                  {user?.genres ? (
                    user?.genres.length > 0 && (
                      <Flex direction="row">
                        <Text
                          fontSize={isMobile ? "2xs" : "sm"}
                          fontWeight={"bold"}
                        >
                          Genres:{" "}
                        </Text>
                        <Wrap ml="2" mt={0.5}>
                          {user?.genres.map((genre, index) => (
                            <WrapItem key={index} mr="1">
                              <Text
                                variant="subtle"
                                color="#2e69a7"
                                fontSize={isMobile ? "2xs" : "xs"}
                              >
                                {genre.toUpperCase()}
                              </Text>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Flex>
                    )
                  ) : (
                    <></>
                  )}
                  {user?.signed && (
                    <Flex direction="row">
                      {user?.signed && (
                        <>
                          <Text
                            fontSize={isMobile ? "2xs" : "sm"}
                            fontWeight={"bold"}
                          >
                            Signed:
                          </Text>
                          <Wrap ml="1">
                            <Text fontSize={isMobile ? "2xs" : "sm"}>
                              {user?.signed ? "Yes" : "No"}
                            </Text>
                          </Wrap>
                        </>
                      )}
                    </Flex>
                  )}
                  {user?.languages &&
                    Array.isArray(user.languages) &&
                    user.languages.length > 0 && (
                      <Flex direction="row">
                        <>
                          <Text
                            fontSize={isMobile ? "2xs" : "sm"}
                            fontWeight={"bold"}
                          >
                            Languages:
                          </Text>
                          <Wrap ml="2" mt={0.5}>
                            {user.languages.map((language, index) => (
                              <WrapItem key={index} mr="1">
                                <Text
                                  variant="subtle"
                                  color="#2e69a7"
                                  fontSize={isMobile ? "2xs" : "xs"}
                                >
                                  {language.toUpperCase()}
                                </Text>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </>
                      </Flex>
                    )}
                </VStack>
              )}
            </HStack>
            {/* {!isMobile && !authLoading && authUser.id === user.id && (
              <Button
                pos="flex"
                mb="2"
                top="6"
                ml={{ base: "auto", md: "auto" }}
                right="auto"
                colorScheme="blue"
                onClick={onOpen}
                rounded={{ base: "full", md: "xl" }}
                size="xs"
                display={{ base: "flex", md: "flex" }}
              >
                <Icon as={FiSettings} boxSize={4} />
              </Button>
            )} */}

            {/* {!isMobile && !authLoading && authUser.id !== user.id && (
              <FollowButton
                userId={user.id}
                authUserId={authUser.id}
                isMobile={isMobile}
                updateFollowersCount={updateFollowersCount}
              />
            )} */}

            <EditProfile isOpen={isOpen} onCloseModal={onCloseModal} />
          </Flex>
          {authUser.id === user.id && (
            <Button
              onClick={handleTogglePrivacy}
              backgroundColor={"#6899fe"}
              colorScheme={isProfileLocked ? "red" : "blue"}
            >
              {isProfileLocked ? "Make Profile Public" : "Make Profile Private"}
            </Button>
          )}
          {authUser.id !== user.id && (
            <>
              {firstThreeMutuals.length > 0 ? (
                <Flex
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                  onClick={handleOpenMutualModal}
                >
                  {mutualFollowers.length === 1 && (
                    <Text cursor="pointer" color="blue.500" mr={2}>
                      {mutualFollowers.length} Mutual:
                    </Text>
                  )}
                  {mutualFollowers.length > 1 && (
                    <Text cursor="pointer" color="blue.500">
                      {mutualFollowers.length} Mutuals:
                    </Text>
                  )}
                  <AvatarGroup max={3} size={"sm"}>
                    {firstThreeMutuals.map((mutualID, index) => (
                      <MutualAvatar key={index} mutualID={mutualID} />
                    ))}
                  </AvatarGroup>
                </Flex>
              ) : (
                <Text>No mutual followers</Text>
              )}
              <MutualFollowersModal
                isOpen={isMutualModalOpen}
                onClose={handleCloseMutualModal}
                followers={uniqueFollowers} // You need to have these states ready
                following={user?.following}
                currentUserId={authUser.id}
              />{" "}
            </>
          )}

          {/* <Divider /> */}

          {!isProfileLocked ||
          authUser.id === user.id ||
          isFriends ||
          isFollowBack ? (
            <Box alignContent="center">
              {posts && posts.length ? (
                <PostsList posts={posts} />
              ) : (
                <Text>No posts found.</Text>
              )}
            </Box>
          ) : (
            <Box alignContent="center">
              <Text>This profile is private. Follow to see their posts.</Text>
            </Box>
          )}
        </VStack>
      </Box>
    );
  } else {
    return <PageNotFound />;
  }
}

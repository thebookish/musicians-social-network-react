import { SearchIcon } from "@chakra-ui/icons";
import {
  AvatarBadge,
  Badge,
  Box,
  Divider,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import { Plus } from "phosphor-react";
import { Link } from "react-router-dom";
import { ChatList } from "./buttons";
import CreateGroup from "./createGroup";
import { useEffect, useState } from "react";
import { useAuth } from "hooks/auth";
import { db } from "lib/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { GetUsersFromId } from "hooks/users";
import UserGroup from "./userGroups";
import { useUser } from "hooks/users";

const Search = ({ onChange }) => {
  return (
    <InputGroup borderRadius={"xl"} backgroundColor={"transparent"}>
      <InputLeftElement pointerEvents="none">
        <SearchIcon color="gray.300" mb={4} />
      </InputLeftElement>
      <Input type="text"
          placeholder="Search for a group"
          color="black"
          fontSize={12}
          ml={-1}
          mb={2}
          height={"6"}
          onChange={onChange} />
    </InputGroup>
  );
};

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

    <AvatarGroup>
    <Avatar
      size="sm"
      src={user.avatar}
      // Prevent pointer events if you want to disable clicking or interaction
      style={{ pointerEvents: "none" }}
    /></AvatarGroup>
  );
};


const GroupList = ({ groups, onSelectGroup }) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Stack spacing={2.4}>
      <Text fontSize="xl" mb={4}>
        All Groups
      </Text>
      {groups.map((group) => (
        <Box
          key={group.id}
          p={2}
          borderRadius="lg"
          backgroundColor={colorMode === "light" ? "gray.100" : "whiteAlpha.100"}
          _hover={{ bg: "gray.200", cursor: "pointer" }}
          onClick={() => onSelectGroup(group.id)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={2} align="center">
              <AvatarGroup size="sm" max={8}>
                {group.members.slice(0, 3).map((member, index) => (
                  <MutualAvatar key={index} mutualID={member} />
                ))}
                {group.members.length > 3 && (
                  <Text>+{(group.members.length - 3).toString()}</Text>
                )}
              </AvatarGroup>
                <Divider orientation="vertical" height="24px"  borderColor="black"/>
                <Stack spacing={0.3} textAlign={"left"}>
                  <Text
                    variant="subtitle2"
                    as="b"
                    fontSize={isMobile ? "xs" : "sm"}
                  >
                    {group.groupName} - {group.lastMessageTimestamp}
                  </Text>
                  <Text
                    variant="caption"
                    as="p"
                    fontSize={isMobile ? "xs" : "sm"}
                  >
                    ~{group.username}: {group.lastMessage ? `${group.lastMessage.substring(0, 13)}${group.lastMessage.length > 50 ? '...' : ''}` : "No messages yet"}
                  </Text>
                </Stack>
                

              </Stack>
            </Box>
            <Stack spacing={1} alignItems="center">
              <Text
                fontWeight={600}
                fontSize={isMobile ? "xs" : "sm"}
                variant="caption"
              >
                {group.lastMessageTime || ""}
              </Text>
              {group.unreadCount > 0 && (
                <Badge
                  backgroundColor="blue"
                  color="white"
                  size={isMobile ? "lg" : "xl"}
                  rounded="xl"
                >
                  {group.unreadCount}
                </Badge>
              )}
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};


const Groups = ({ onGroupSelect }) => {

  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [openDialog, setOpenDialog] = useState(false);

  const [groups, setGroups] = useState([]);
  const { user: authUser } = useAuth();
  
  useEffect(() => {
    if (!authUser?.id) return;

    // Listen to user's groups in real-time
    const userDocRef = doc(db, "users", authUser.id);
    const unsubscribeFromUserGroups = onSnapshot(userDocRef, (userDoc) => {
      if (!userDoc.exists()) {
        console.log("No user document found");
        return;
      }

      const userGroups = userDoc.data().groups || [];
      // Updated part inside your useEffect
      const groupsPromises = userGroups.map(async (groupId) => {
        let lastMessageTimestamp;

        const groupDocRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupDocRef);
        if (!groupSnap.exists()) return null; // Exit if group snapshot doesn't exist
      
        const groupData = { id: groupId, ...groupSnap.data() };
      
        const messagesRef = collection(db, "groups", groupId, "messages");
        const lastMessageQuery = query(messagesRef, orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(lastMessageQuery);
      
        let lastMessageText = "No messages yet";
        let username = "Unknown"; // Default username

        
        if (!querySnapshot.empty) {
          const lastMessageDoc = querySnapshot.docs[0];
          const lastMessageData = lastMessageDoc.data();
          

      
          // Format message text or indicate "Media Content"
          lastMessageText = lastMessageData.subtype === "doc" ? "Media Content" : lastMessageData.message;
      
          // Fetch and await user document for username
          const userDocRef = doc(db, "users", lastMessageData.sentBy);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            username = userDocSnap.data().username;
          }
      

          if (lastMessageData.createdAt && typeof lastMessageData.createdAt.toDate === 'function') {
              lastMessageTimestamp = lastMessageData.createdAt.toDate();
              lastMessageTimestamp = formatDate(lastMessageTimestamp)
          } else {
              // Handle the case where createdAt is not a Firestore Timestamp
              // For example, you could default to the current time:
              lastMessageTimestamp = new Date();
              lastMessageTimestamp = formatDate(lastMessageTimestamp)
          }

        }
      
        return { ...groupData, lastMessage: lastMessageText, username, lastMessageTimestamp };
      });
      

      // After mapping promises, use Promise.all to resolve them
      Promise.all(groupsPromises).then((groupsWithLastMessageAndUsername) => {
        setGroups(groupsWithLastMessageAndUsername);
      });


      Promise.all(groupsPromises).then((groupsWithLastMessage) => {
        setGroups(groupsWithLastMessage);
      });
    });

    return () => unsubscribeFromUserGroups(); // Clean up subscription
  }, [authUser?.id]);

  const formatDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
    // Format as HH:MM if the message was sent today
    if (messageDate.getTime() === today.getTime()) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      // Format as DD/MM/YY if the message was sent on a different day
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSelectGroup = (groupId) => {
    onGroupSelect(groupId);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredGroups = groups.filter(group =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Stack direction={"row"} width={"100%"}>
        {/* Left */}
        <Box
          position={"relative"}
          height={"100%"}
          width={isMobile ? "auto" : "30%"}
          backgroundColor={colorMode === "light" ? "#fff" : "blackAlpha.300"}
          boxShadow={"sm"}
          zIndex={2}
        >
          <Stack spacing={2} p={3} height={"100%"}>
            <Stack
              direction={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Text fontSize={"xl"} as={"b"}>
                Groups
              </Text>
            </Stack>
            <Stack width={"100%"}>
              <Search onChange={handleSearchChange} />
            </Stack>
            <Stack
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
            >
              <Text
                variant={"subtitle2"}
                as={Link}
                color={"blue"}
                fontSize={14}
                onClick={() => {
                  setOpenDialog(true);
                }}
              >
                Create New Group
              </Text>
              <IconButton
                color={"blue"}
                backgroundColor={"transparent"}
                onClick={() => {
                  setOpenDialog(true);
                }}
              >
                <Plus />
              </IconButton>
            </Stack>
            <Divider />
            <Stack
              direction={"column"}
              flexGrow={1}
              overflow={"scroll"}
              height={"100%"}
              spacing={2}
            >

              <Stack spacing={2.4}>
                <GroupList groups={filteredGroups} onSelectGroup={handleSelectGroup} />
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Right */}


        {openDialog && (
          <CreateGroup open={openDialog} handleClose={handleCloseDialog} />
        )}
      </Stack>
    </>
  );
};

export default Groups;
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Image,
  Stack,
  Text,
  useColorMode,
  Heading,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { ToggleSidebar, UpdateSidebarType } from "./redux/slices/app";
import { CaretRight } from "phosphor-react";
import { db } from "lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "hooks/auth";
import { useUser } from "hooks/users"; // Assuming useUser is a custom hook for fetching user data

const Contact = ({ userPressed }) => {
  const dispatch = useDispatch();
  const { colorMode } = useColorMode();
  const { user: authUser } = useAuth(); // Authenticated user
  const { user: userr, isLoading: isLoadingUserr } = useUser(userPressed); // UserPressed details
  const [mediaLinks, setMediaLinks] = useState([]);
  const [sharedGroups, setSharedGroups] = useState([]);

  useEffect(() => {
   

    const fetchSharedGroups = async () => {
      if (!authUser?.id || !userPressed) return;
      try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("members", "array-contains", authUser.id));
        const querySnapshot = await getDocs(q);
        const groups = [];
        querySnapshot.forEach((doc) => {
          const group = doc.data();
          if (group.members.includes(userPressed)) {
            groups.push(group);
          }
        });
        setSharedGroups(groups);
      } catch (error) {
        console.error("Error fetching shared groups: ", error);
      }
    };

    fetchSharedGroups();
  }, [authUser, userPressed]);

  if (isLoadingUserr) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box width={"40%"} height={"100%"}>
      <Stack height={"100%"}>
        {/* Header */}
        <Box width={"100%"}>
          <Stack
            height={"100%"}
            p={2}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
            spacing={3}
            backgroundColor={
              colorMode === "light" ? "gray.100" : "whiteAlpha.100"
            }
          >
            <Text
              color={colorMode === "light" ? "black" : "white"}
              variant={"subtitle2"}
            >
              Contact Info
            </Text>
            <IconButton
              onClick={() => {
                dispatch(ToggleSidebar());
              }}
              icon={<FiX />}
            />
          </Stack>
        </Box>
        {/* Body */}
        <Stack
          height={"100%"}
          position={"relative"}
          flexGrow={1}
          overflowY={"scroll"}
          p={3}
          spacing={3}
        >
          <Stack alignItems={"center"} direction={"row"} spacing={2}>
            <Avatar src={userr?.avatar} alt="Name" height={12} width={12} />
            <Stack spacing={0.5}>
              <Text variant={"article"} fontWeight={600}>
                {userr?.fullName
                  ? userr.fullName
                  : userr?.businessName
                  ? userr.businessName
                  : "Error"}
              </Text>
              <Text variant={"body2"} fontWeight={500}>
                @{userr?.username}
              </Text>
            </Stack>
          </Stack>
          <Divider />
          <Stack spacing={0.5}>
            <Text variant={"article"}>Bio</Text>
            <Text variant={"body2"}>{userr?.bio}</Text>
          </Stack>
          <Divider />
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Text variant={"subtitle2"} fontSize={"sm"}>
              Media, Links & Docs
            </Text>
            <Button
              onClick={() => {
                dispatch(UpdateSidebarType("SHARED"));
              }}
              size="sm"
              rightIcon={<CaretRight />}
            >
              View
            </Button>
          </Stack>
          <Stack direction={"row"} spacing={2} alignItems={"center"}>
            {mediaLinks.map((el, index) => (
              <Box key={index}>
                <Image src={el} alt={"img"} />
              </Box>
            ))}
          </Stack>
          <Divider />
          <Heading fontSize={"sm"}>Groups in common</Heading>
          {sharedGroups.map((group, index) => (
            <Box
              key={index}
              p={2}
              borderRadius="lg"
              backgroundColor={colorMode === "light" ? "gray.100" : "whiteAlpha.100"}
              _hover={{ bg: "gray.200"}}
            >
              <Stack direction={"row"} spacing={2} alignItems={"center"}>
                <Stack spacing={0.5}>
                  <Text variant={"subtitle2"}>{group.groupName}</Text>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

export default Contact;

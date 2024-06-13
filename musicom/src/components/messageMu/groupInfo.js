import React, { useEffect, useState } from "react";
import { Box, Text, Stack, Link,Heading, IconButton, Flex, Avatar,useColorMode ,Divider, Button, useToast, Image, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter } from "@chakra-ui/react";
import { FiX, FiPlus } from "react-icons/fi";
import UserCard from "components/network/UserCard";
import { getDoc, doc, updateDoc, arrayRemove, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "lib/firebase";
import { useAuth } from "hooks/auth";
import AddMembersModal from "./addmembersModal";
import GroupMediaContent from "./mediaContent";
export const PROTECTED = "/protected";

const GroupInfo = ({ groupId, setShowGroupInfo }) => {
  const [groupData, setGroupData] = useState(null);
  const [memberData, setMemberData] = useState({});
  const [mediaMessages, setMediaMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoteMemberId, setPromoteMemberId] = useState(null);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const toast = useToast();
  const { user: authUser } = useAuth();
  const { colorMode } = useColorMode();

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId) return;
      try {
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (groupDoc.exists()) {
          setGroupData(groupDoc.data());
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      }
    };

    fetchGroupData();
  }, [groupId]);

  useEffect(() => {
    const fetchMemberData = async () => {
      if (!groupData) return;

      const memberDataTemp = {};
      await Promise.all(
        groupData.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId));
          if (memberDoc.exists()) {
            memberDataTemp[memberId] = memberDoc.data();
          }
        })
      );
      setMemberData(memberDataTemp);
      setLoading(false);
    };

    fetchMemberData();
  }, [groupData]);

  useEffect(() => {
    const fetchMediaMessages = async () => {
      if (!groupId) return;
      try {
        const messagesRef = collection(db, "groups", groupId, "messages");
        const mediaQuery = query(messagesRef, where("subtype", "in", ["doc", "img", "link"]));
        const mediaDocs = await getDocs(mediaQuery);
        const mediaMessagesTemp = mediaDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMediaMessages(mediaMessagesTemp);
      } catch (error) {
        console.error("Error fetching media messages:", error);
      }
    };

    fetchMediaMessages();
  }, [groupId]);

  const confirmPromoteToAdmin = (memberId) => {
    setPromoteMemberId(memberId);
    toast({
      title: "Promote to Admin",
      description: `Are you sure you want to promote ${memberData[memberId]?.username} to admin?`,
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "top",
      render: () => (
        <Box color="white" p={3} bg="blue.500" borderRadius="md">
          <Text>Are you sure you want to promote {memberData[memberId]?.username} to admin?</Text>
          <Flex mt={2}>
            <Button colorScheme="green" size="sm" onClick={() => promoteToAdmin(memberId)}>
              Confirm
            </Button>
            <Button colorScheme="red" size="sm" ml={3} onClick={() => setPromoteMemberId(null)}>
              Cancel
            </Button>
          </Flex>
        </Box>
      ),
    });
  };

  const promoteToAdmin = async (memberId) => {
    if (!groupData || !groupId) return;
    try {
      const newRoles = { ...groupData.roles, [memberId]: 'admin' };
      const groupDocRef = doc(db, "groups", groupId);
      await updateDoc(groupDocRef, { roles: newRoles });
      setGroupData((prev) => ({ ...prev, roles: newRoles }));

      toast({
        title: "Promotion Successful",
        description: `${memberData[memberId]?.username} has been promoted to admin.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });

      setPromoteMemberId(null);
    } catch (error) {
      console.error("Error promoting to admin:", error);
      toast({
        title: "Promotion Failed",
        description: "An error occurred while promoting the member to admin. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const removeAdminPrivileges = async (memberId) => {
    if (!groupData || !groupId) return;

    const remainingAdmins = Object.values(groupData.roles).filter(role => role === 'admin').length;

    if (remainingAdmins <= 1) {
      toast({
        title: "Cannot Remove Admin Privileges",
        description: "There must be at least one admin in the group.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const newRoles = { ...groupData.roles, [memberId]: undefined };
      delete newRoles[memberId];

      const groupDocRef = doc(db, "groups", groupId);
      await updateDoc(groupDocRef, { roles: newRoles });
      setGroupData((prev) => ({ ...prev, roles: newRoles }));

      toast({
        title: "Admin Privileges Removed",
        description: `${memberData[memberId]?.username} is no longer an admin.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Error removing admin privileges:", error);
      toast({
        title: "Removal Failed",
        description: "An error occurred while removing admin privileges. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const removeFromGroup = async (memberId) => {
    if (!groupData || !groupId) return;

    const isRemovingSelf = memberId === authUser.id;
    const remainingAdmins = Object.values(groupData.roles).filter(role => role === 'admin').length;

    if (isRemovingSelf && remainingAdmins <= 1) {
      toast({
        title: "Cannot remove yourself",
        description: "You cannot remove yourself as the only admin. Please assign another admin first.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const newMembers = groupData.members.filter(id => id !== memberId);
      const { [memberId]: _, ...newRoles } = groupData.roles; // Remove member from roles

      const groupDocRef = doc(db, "groups", groupId);
      await updateDoc(groupDocRef, { members: newMembers, roles: newRoles });

      const memberDocRef = doc(db, "users", memberId);
      await updateDoc(memberDocRef, { groups: arrayRemove(groupId) });

      setGroupData((prev) => ({ ...prev, members: newMembers, roles: newRoles }));
      setMemberData((prev) => {
        const newMemberData = { ...prev };
        delete newMemberData[memberId];
        return newMemberData;
      });

      toast({
        title: "Member removed",
        description: `${memberData[memberId]?.username} has been removed from the group.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } catch (error) {
      console.error("Error removing from group:", error);
      toast({
        title: "Error removing member",
        description: "An error occurred while removing the member. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const handleRemoveMember = (memberId) => {
    setMemberToRemove(memberId);
    setIsConfirmationModalOpen(true);
  };

  const confirmRemoveMember = async () => {
    await removeFromGroup(memberToRemove);
    setIsConfirmationModalOpen(false);
    setMemberToRemove(null);
  };

  if (!groupData || !authUser) {
    return <Text>Loading group information...</Text>;
  }

  const isAdmin = groupData.roles[authUser?.id] === 'admin';

  return (
    <Box
      width="100%"
      p={4}
      backgroundColor={colorMode === 'dark' ? "gray.800" : "white"}
      boxShadow={"lg"}
      borderRadius="md"
      maxWidth="600px"
      mx="auto"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Group Information</Heading>
        <IconButton
          icon={<FiX />}
          size="sm"
          onClick={() => setShowGroupInfo(false)}
          aria-label="Close"
          variant="ghost"
        />
      </Flex>
  
      <Divider mb={4} />
  
      <Heading size="sm" mb={2}>Media</Heading>
      <Stack spacing={4} maxHeight="300px" overflowY="auto" overflowX="hidden" border="1px solid #E2E8F0" borderRadius="md" p={2}>
        {mediaMessages.length > 0 ? (
          mediaMessages.map((message) => (
            <GroupMediaContent key={message.id} message={message} />
          ))
        ) : (
          <Text>No media content available.</Text>
        )}
      </Stack>
  
      <Divider my={4} />
  
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Heading size="sm">{groupData.members.length} Members</Heading>
        {isAdmin && (
          <IconButton
            icon={<FiPlus />}
            size="sm"
            onClick={() => setIsAddMembersModalOpen(true)}
            aria-label="Add Members"
            colorScheme="blue"
            variant="outline"
          />
        )}
      </Flex>
  
      <Stack spacing={4} maxHeight="300px" overflowY="auto" border="1px solid #E2E8F0" borderRadius="md" p={2}>
        {loading ? (
          <Text>Loading members...</Text>
        ) : (
          groupData.members.map((memberId) => {
            const user = memberData[memberId];
            if (!user) return null;
            const isAdminMember = groupData.roles[memberId] === 'admin';
            return (
              <Flex key={memberId} align="center" justify="space-between" p={2} borderBottom="1px solid #E2E8F0">
                <Flex align="center">
                  <Avatar as={Link}
                href={`${PROTECTED}/profile/${user.username}`} src={user.avatar} size="sm" mr={2} />
                  <Text as={Link}
                href={`${PROTECTED}/profile/${user.username}`} fontWeight="bold">{user.username}</Text>
                  {isAdminMember && (
                    <Text ml={1} fontSize="sm" color="gray.500">(Admin)</Text>
                  )}
                </Flex>
                {isAdmin && (
                  <Button ml={2} onClick={() => handleRemoveMember(memberId)} size="sm" colorScheme="red" variant="ghost">
                    Remove
                  </Button>
                )}
              </Flex>
            );
          })
        )}
      </Stack>
  
      <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Removal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to remove this member from the group?</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={confirmRemoveMember}>Remove</Button>
            <Button variant="ghost" onClick={() => setIsConfirmationModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GroupInfo;

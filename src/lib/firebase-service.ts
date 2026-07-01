import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Recipe, DayPlan, GroceryItem } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- USER PROFILE OPERATIONS ---

export async function getUserProfile(uid: string) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createUserProfile(
  uid: string, 
  data: { 
    email: string; 
    displayName: string; 
    groupId: string;
    ownedGroups?: string[];
  }
) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const profile = {
      uid,
      email: data.email,
      displayName: data.displayName,
      groupId: data.groupId,
      joinedGroups: [data.groupId],
      ownedGroups: data.ownedGroups !== undefined ? data.ownedGroups : [data.groupId],
      createdAt: new Date().toISOString()
    };
    await setDoc(docRef, profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return null;
  }
}

export async function updateUserProfileGroupId(uid: string, groupId: string) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { groupId });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function updateUserProfileFull(
  uid: string, 
  data: { groupId: string; joinedGroups?: string[]; ownedGroups?: string[] }
) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const updateData: any = { groupId: data.groupId };
    if (data.joinedGroups) updateData.joinedGroups = data.joinedGroups;
    if (data.ownedGroups) updateData.ownedGroups = data.ownedGroups;
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function removeGroupMember(memberUid: string, currentGroupId: string, newRandomGroupId: string) {
  const path = `users/${memberUid}`;
  try {
    const docRef = doc(db, "users", memberUid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentJoined: string[] = data.joinedGroups || [currentGroupId];
      const updatedJoined = currentJoined.filter(id => id !== currentGroupId);
      if (!updatedJoined.includes(newRandomGroupId)) {
        updatedJoined.push(newRandomGroupId);
      }
      
      const currentOwned: string[] = data.ownedGroups || [];
      const updatedOwned = currentOwned.filter(id => id !== currentGroupId);
      if (!updatedOwned.includes(newRandomGroupId)) {
        updatedOwned.push(newRandomGroupId);
      }

      await updateDoc(docRef, {
        groupId: newRandomGroupId,
        joinedGroups: updatedJoined,
        ownedGroups: updatedOwned
      });
      return true;
    }
    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function joinGroup(uid: string, groupId: string) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const joined: string[] = data.joinedGroups || [data.groupId || groupId];
      if (!joined.includes(groupId)) {
        joined.push(groupId);
      }
      await updateDoc(docRef, { 
        groupId,
        joinedGroups: joined
      });
      return { ...data, groupId, joinedGroups: joined };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return null;
  }
}

export async function createNewGroup(uid: string, newGroupId: string) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const joined: string[] = data.joinedGroups || [data.groupId || newGroupId];
      if (!joined.includes(newGroupId)) {
        joined.push(newGroupId);
      }
      const owned: string[] = data.ownedGroups || [];
      if (!owned.includes(newGroupId)) {
        owned.push(newGroupId);
      }
      await updateDoc(docRef, {
        groupId: newGroupId,
        joinedGroups: joined,
        ownedGroups: owned
      });
      return { ...data, groupId: newGroupId, joinedGroups: joined, ownedGroups: owned };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return null;
  }
}

export async function getGroupMembers(groupId: string) {
  const path = "users";
  try {
    const q = query(collection(db, "users"), where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);
    const members: any[] = [];
    querySnapshot.forEach((doc) => {
      members.push(doc.data());
    });
    return members;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// --- RECIPES REAL-TIME & WRITE OPERATIONS ---

export function subscribeRecipes(groupId: string, callback: (recipes: Recipe[]) => void, onError?: (err: Error) => void) {
  const path = "recipes";
  const q = query(collection(db, "recipes"), where("groupId", "==", groupId));
  return onSnapshot(q, (snapshot) => {
    const recipes: Recipe[] = [];
    snapshot.forEach((doc) => {
      recipes.push(doc.data() as Recipe);
    });
    callback(recipes);
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (err: any) {
      if (onError) onError(err);
    }
  });
}

export async function addRecipe(recipe: Recipe, groupId: string) {
  const path = `recipes/${recipe.id}`;
  try {
    const docRef = doc(db, "recipes", recipe.id);
    await setDoc(docRef, {
      ...recipe,
      groupId,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function toggleFavoriteRecipe(id: string, currentFavorite: boolean) {
  const path = `recipes/${id}`;
  try {
    const docRef = doc(db, "recipes", id);
    await updateDoc(docRef, { isFavorite: !currentFavorite });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function deleteRecipe(id: string) {
  const path = `recipes/${id}`;
  try {
    const docRef = doc(db, "recipes", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

// --- CALENDAR PLANS REAL-TIME & WRITE OPERATIONS ---

export function subscribeCalendarPlans(groupId: string, callback: (plans: DayPlan[]) => void, onError?: (err: Error) => void) {
  const path = "calendarPlans";
  const q = query(collection(db, "calendarPlans"), where("groupId", "==", groupId));
  return onSnapshot(q, (snapshot) => {
    const plans: DayPlan[] = [];
    snapshot.forEach((doc) => {
      plans.push(doc.data() as DayPlan);
    });
    callback(plans);
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (err: any) {
      if (onError) onError(err);
    }
  });
}

export async function saveCalendarPlan(planId: string, payload: any) {
  const path = `calendarPlans/${planId}`;
  try {
    const docRef = doc(db, "calendarPlans", planId);
    await setDoc(docRef, payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

// --- GROCERY LIST REAL-TIME & WRITE OPERATIONS ---

export function subscribeGroceryList(groupId: string, callback: (items: GroceryItem[]) => void, onError?: (err: Error) => void) {
  const path = "groceryList";
  const q = query(collection(db, "groceryList"), where("groupId", "==", groupId));
  return onSnapshot(q, (snapshot) => {
    const items: GroceryItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: data.id,
        groupId: data.groupId,
        name: data.name,
        category: data.category,
        isCompleted: data.completed || false,
        amount: data.amount,
        source: data.source,
        recipeId: data.recipeId
      } as GroceryItem);
    });
    callback(items);
  }, (error) => {
    try {
      handleFirestoreError(error, OperationType.GET, path);
    } catch (err: any) {
      if (onError) onError(err);
    }
  });
}

export async function addGroceryItem(item: any, groupId: string) {
  const path = `groceryList/${item.id}`;
  try {
    const docRef = doc(db, "groceryList", item.id);
    await setDoc(docRef, {
      id: item.id,
      groupId,
      name: item.name,
      category: item.category || 'Market',
      completed: item.completed || false,
      amount: item.amount || '',
      source: item.source || 'manual',
      recipeId: item.recipeId || null,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function toggleGroceryItem(id: string, currentCompleted: boolean) {
  const path = `groceryList/${id}`;
  try {
    const docRef = doc(db, "groceryList", id);
    await updateDoc(docRef, { completed: !currentCompleted });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

export async function deleteGroceryItem(id: string) {
  const path = `groceryList/${id}`;
  try {
    const docRef = doc(db, "groceryList", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function clearCompletedGrocery(groupId: string) {
  const path = "groceryList";
  try {
    const q = query(
      collection(db, "groceryList"), 
      where("groupId", "==", groupId), 
      where("completed", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function clearAllGrocery(groupId: string) {
  const path = "groceryList";
  try {
    const q = query(collection(db, "groceryList"), where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

// --- USER PROFILE REAL-TIME SUBSCRIPTION ---
export function subscribeUserProfile(uid: string, callback: (profile: any) => void) {
  const docRef = doc(db, "users", uid);
  const path = `users/${uid}`;
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

// --- GROUP JOIN REQUESTS & APPROVALS ---
export async function checkGroupExists(groupId: string) {
  try {
    const q1 = query(collection(db, "users"), where("groupId", "==", groupId));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return true;

    const q2 = query(collection(db, "users"), where("joinedGroups", "array-contains", groupId));
    const snap2 = await getDocs(q2);
    return !snap2.empty;
  } catch (error) {
    console.error("Error checking group existence:", error);
    return false;
  }
}

export async function createJoinRequest(userId: string, displayName: string, email: string, groupId: string) {
  const requestId = `${userId}_${groupId}`;
  const docRef = doc(db, "groupRequests", requestId);
  try {
    await setDoc(docRef, {
      id: requestId,
      userId,
      displayName,
      email,
      groupId,
      status: "pending",
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error creating join request:", error);
    return false;
  }
}

export function subscribeJoinRequests(groupIds: string[], callback: (requests: any[]) => void) {
  if (!groupIds || groupIds.length === 0) {
    callback([]);
    return () => {};
  }
  const path = "groupRequests";
  const q = query(
    collection(db, "groupRequests"),
    where("groupId", "in", groupIds),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snapshot) => {
    const requests: any[] = [];
    snapshot.forEach((doc) => {
      requests.push(doc.data());
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeSentJoinRequests(userId: string, callback: (requests: any[]) => void) {
  const path = "groupRequests";
  const q = query(
    collection(db, "groupRequests"),
    where("userId", "==", userId),
    where("status", "==", "pending")
  );
  return onSnapshot(q, (snapshot) => {
    const requests: any[] = [];
    snapshot.forEach((doc) => {
      requests.push(doc.data());
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function approveJoinRequest(requestId: string, requestingUserId: string, targetGroupId: string) {
  try {
    const userRef = doc(db, "users", requestingUserId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const joined = userData.joinedGroups || [];
      if (!joined.includes(targetGroupId)) {
        joined.push(targetGroupId);
      }
      await updateDoc(userRef, {
        groupId: targetGroupId,
        joinedGroups: joined
      });
    }

    const requestRef = doc(db, "groupRequests", requestId);
    await deleteDoc(requestRef);
    return true;
  } catch (error) {
    console.error("Error approving join request:", error);
    return false;
  }
}

export async function rejectJoinRequest(requestId: string) {
  try {
    const requestRef = doc(db, "groupRequests", requestId);
    await deleteDoc(requestRef);
    return true;
  } catch (error) {
    console.error("Error rejecting join request:", error);
    return false;
  }
}

export async function claimGroupAdmin(uid: string, groupId: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const owned = userData.ownedGroups || [];
      if (!owned.includes(groupId)) {
        owned.push(groupId);
      }
      await updateDoc(userRef, {
        ownedGroups: owned
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error claiming group admin:", error);
    return false;
  }
}



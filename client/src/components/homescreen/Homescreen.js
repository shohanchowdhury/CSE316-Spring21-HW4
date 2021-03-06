import React, { useState, useEffect } 	from 'react';
import Logo 							from '../navbar/Logo';
import NavbarOptions 					from '../navbar/NavbarOptions';
import MainContents 					from '../main/MainContents';
import SidebarContents 					from '../sidebar/SidebarContents';
import Login 							from '../modals/Login';
import Delete 							from '../modals/Delete';
import CreateAccount 					from '../modals/CreateAccount';
import EditAccount						from '../modals/EditAccount';
import Subregion						from '../modals/Subregion';
import { GET_DB_TODOS } 				from '../../cache/queries';
import * as mutations 					from '../../cache/mutations';
import { useMutation, useQuery } 		from '@apollo/client';
import { WNavbar, WSidebar, WNavItem } 	from 'wt-frontend';
import { WLayout, WLHeader, WLMain, WLSide } from 'wt-frontend';
import { GET_DB_USER } 				from '../../cache/queries';
import Globe from './Globe.png';
import { UpdateListField_Transaction, 
	UpdateListItems_Transaction, 
	ReorderItems_Transaction,
	SortList_Transaction,
	EditItem_Transaction } 				from '../../utils/jsTPS';
import WInput from 'wt-frontend/build/components/winput/WInput';
import { Query } from 'mongoose';


const Homescreen = (props) => {

	
	let todolists 							= [];
	const [activeList, setActiveList] 		= useState({});
	const [showDelete, toggleShowDelete] 	= useState(false);
	const [showLogin, toggleShowLogin] 		= useState(false);
	const [showCreate, toggleShowCreate] 	= useState(false);
	const [showEdit, toggleShowEdit]		= useState(false);
	const [loggedIn, toggleLoggedIn]		= useState(false);
	const [showSubregion, toggleShowSubregion]		= useState(false);


	const [currentUser, currentUserSet]		=useState(null);
	const [currentList, currentListSet]		=useState(null);
	const [currentRegion, currentRegionSet] =useState(null);

	const [ReorderTodoItems] 		= useMutation(mutations.REORDER_ITEMS);
	const [UpdateTodoItemField] 	= useMutation(mutations.UPDATE_ITEM_FIELD);
	const [UpdateTodolistField] 	= useMutation(mutations.UPDATE_TODOLIST_FIELD);
	const [DeleteTodolist] 			= useMutation(mutations.DELETE_TODOLIST);
	const [DeleteTodoItem] 			= useMutation(mutations.DELETE_ITEM);
	const [AddTodolist] 			= useMutation(mutations.ADD_TODOLIST);
	const [AddTodoItem] 			= useMutation(mutations.ADD_ITEM);
	const [SortListItems]			= useMutation(mutations.SORT_LIST)


	const { loading, error, data, refetch } = useQuery(GET_DB_TODOS);
	// if(loading) { console.log(loading, 'loading'); }
	if(error) { console.log(error, 'error'); }
	if(data) { todolists = data.getAllTodos; }
	
	const a = "assd";
	let user = null;
	var {data2 } = useQuery(GET_DB_USER);
    if(data2) { user = data2.getCurrentUser; }
	if(user){console.log(user.email); }
    console.log(user)



	const auth = props.user === null ? false : true;


	

	const refetchTodos = async (refetch) => {
		const { loading, error, data } = await refetch();
		if (data) {
			todolists = data.getAllTodos;
			if (activeList._id) {
				let tempID = activeList._id;
				let list = todolists.find(list => list._id === tempID);
				setActiveList(list);
			}
		}
	}

	const tpsUndo = async () => {
		console.log("UNDOINNGGG")
		console.log(props.tps)
		const retVal = await props.tps.undoTransaction();
		refetchTodos(refetch);
		return retVal;
	}

	const tpsRedo = async () => {
		const retVal = await props.tps.doTransaction();
		refetchTodos(refetch);
		return retVal;
	}

	const hasUndo = () => {
		const retVal = props.tps.hasTransactionToUndo();
		//console.log(retVal)
		return retVal;
		// console.log("what")
		// return true;
	}

	const hasRedo = () => {
		const retVal = props.tps.hasTransactionToRedo();
		//console.log(retVal)
		return retVal;
	}

	const resetTps = () => {
		props.tps.clearAllTransactions();
	}


	
	// Creates a default item and passes it to the backend resolver.
	// The return id is assigned to the item, and the item is appended
	//  to the local cache copy of the active todolist. 
	const addItem = async () => {
		let list = activeList;
		const items = list.items;
		const lastID = items.length >= 1 ? items[items.length - 1].id + 1 : 0;
		const newItem = {
			_id: '',
			id: lastID,
			description: '',
			due_date: '',
			assigned_to: "",
			completed: false
		};
		let opcode = 1;
		let itemID = newItem._id;
		let listID = activeList._id;
		let transaction = new UpdateListItems_Transaction(listID, itemID, newItem, opcode, AddTodoItem, DeleteTodoItem);
		props.tps.addTransaction(transaction);
		tpsRedo();
	};


	const deleteItem = async (item, index) => {
		let listID = activeList._id;
		let itemID = item._id;
		let opcode = 0;
		let itemToDelete = {
			_id: item._id,
			id: item.id,
			description: item.description,
			due_date: item.due_date,
			assigned_to: item.assigned_to,
			completed: item.completed
		}
		let transaction = new UpdateListItems_Transaction(listID, itemID, itemToDelete, opcode, AddTodoItem, DeleteTodoItem, index);
		props.tps.addTransaction(transaction);
		tpsRedo();
	};

	const editItem = async (itemID, field, value, prev) => {
		let flag = 0;
		if (field === 'completed') flag = 1;
		let listID = activeList._id;
		let transaction = new EditItem_Transaction(listID, itemID, field, prev, value, flag, UpdateTodoItemField);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const reorderItem = async (itemID, dir) => {
		let listID = activeList._id;
		let transaction = new ReorderItems_Transaction(listID, itemID, dir, ReorderTodoItems);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const sortList = async (itemID, dir, listItems) => {
		
		let listID = activeList._id;
		console.log(listItems)
		let transaction = new SortList_Transaction(listID, itemID, dir, listItems, SortListItems);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};


	const createNewList = async () => {
		props.tps.clearAllTransactions()

		const length = todolists.length
		const id = length >= 1 ? todolists[length - 1].id + Math.floor((Math.random() * 100) + 1) : 1;
		let list = {
			_id: '',
			id: id,
			name: 'Untitled',
			owner: props.user._id,
			items: [],
		}
		const { data } = await AddTodolist({ variables: { todolist: list }, refetchQueries: [{ query: GET_DB_TODOS }] });
		await refetchTodos(refetch);
		if(data) {
		let _id = data.addTodolist;
		//handleSetActive(_id);
		} 
	};

	const deleteList = async (_id) => {
		DeleteTodolist({ variables: { _id: _id }, refetchQueries: [{ query: GET_DB_TODOS }] });
		refetch();
		setActiveList({});
		props.tps.clearAllTransactions()

	};

	const updateListField = async (_id, field, value, prev) => {
		let transaction = new UpdateListField_Transaction(_id, field, prev, value, UpdateTodolistField);
		props.tps.addTransaction(transaction);
		tpsRedo();

	};

	const handleSetActive = async (_id) => {
		const todo = todolists.find(todo => todo._id === _id || todo.id === _id);
		setActiveList(todo);
		props.tps.clearAllTransactions()
	};

	
	/*
		Since we only have 3 modals, this sort of hardcoding isnt an issue, if there
		were more it would probably make sense to make a general modal component, and
		a modal manager that handles which to show.
	*/
	const setShowLogin = () => {
		toggleShowDelete(false);
		toggleShowCreate(false);
		toggleShowLogin(!showLogin);
		toggleLoggedIn(true);
	};

	const setShowCreate = () => {
		toggleShowDelete(false);
		toggleShowLogin(false);
		toggleShowCreate(!showCreate);
	};

	const setShowDelete = () => {
		toggleShowCreate(false);
		toggleShowLogin(false);
		toggleShowDelete(!showDelete)
	};

	const setShowEdit = () => {
		// console.log("ASDASDSAD")
		toggleShowDelete(false);
		toggleShowLogin(false);
		toggleShowEdit(!showEdit);
	};

	
	const setShowSubregion = () => {
		// console.log("ASDASDSAD")
		toggleShowSubregion(!showSubregion);
	};

	const dosomething = () => {
		console.log("ASDASDSDASD")
	};

	const loggerOuting = () =>{
		toggleLoggedIn(false);
	};

	const updateUser = (e) =>{
		user = e;
		console.log(user)
		currentUserSet(e)
	}
	const getUser = () =>{
		return currentUser;
	}
	const getActiveList = () =>{
		return activeList;
	}
	const updateRegion = (e) =>{
		currentRegionSet(true);
		console.log(e)

		toggleShowSubregion(true);
		console.log("WOWZX")
		console.log(currentRegion)

	}
	
	



	return (
		
		<WLayout wLayout="header-lside">
			<WLHeader>
				<WNavbar color="colored">
					<ul>
						<WNavItem>
							<Logo className='logo' />
						</WNavItem>
					</ul>
					<ul>
						<NavbarOptions
							loggerOuting={loggerOuting}
							fetchUser={props.fetchUser} auth={auth} 
							user={user}
							setShowCreate={setShowCreate} setShowLogin={setShowLogin}
							setShowEdit={setShowEdit}
							refetchTodos={refetch} setActiveList={setActiveList}
							loggerOuting={loggerOuting}
							updateUser={updateUser}
						/>
					</ul>
				</WNavbar>

				
				
			</WLHeader>
			{
			loggedIn && JSON.stringify(activeList)==="{}"?
			<div className="wsidebar">
				<div className = "header-map-modal"> Your Maps</div>
				<img src={Globe} alt="Logo"  className="photo2"/>
					{
						activeList ?
							<SidebarContents
								todolists={todolists} 
								activeid={activeList.id} auth={auth}
								activeList={activeList}
								handleSetActive={handleSetActive} createNewList={createNewList}
								undo={tpsUndo} redo={tpsRedo}
								updateListField={updateListField}
								getActiveList={getActiveList}
								setShowDelete={setShowDelete}

							/>
							:
							<></>
					}
				<div className="createMapBig">
					<span className ="createMapB"  onClick={createNewList} > Create New Map</span>

				</div>
				
			</div>
			:
			<div></div>
			}
			
			<WLMain>

			
				{!loggedIn ?
					<div className="welcome">

						<img src={Globe} alt="Logo"  className="photo" />
						{/* <div classname="welcomeText">
							Welcome To The World Data Mapper
						</div> */}
						<h1>Welcome To The World Data Mapper</h1>
						<h1>{user}</h1>
					</div>
				:
					<div>
							{
						activeList ? 
								<div className="container-secondary">
									<MainContents
										addItem={addItem} deleteItem={deleteItem}
										editItem={editItem} reorderItem={reorderItem}
										setShowDelete={setShowDelete}
										sortList={sortList}
										loggerOuting={loggerOuting}
										activeList={activeList} setActiveList={setActiveList}
										setShowEdit={setShowEdit} showEdit={showEdit}
										setShowSubregion={setShowSubregion} showSubregion={showSubregion}
										undo={tpsUndo} redo={tpsRedo}
										hasUndo={hasUndo} hasRedo={hasRedo}
										resetTps={resetTps}
										todolists={todolists} 
										activeid={activeList.id} auth={auth}
										updateRegion={updateRegion}
										handleSetActive={handleSetActive} createNewList={createNewList}
										updateListField={updateListField}
										currentRegion={currentRegion}

									/>
								</div>
							:
								<div className="container-secondary" />
					}
			

					</div>
				}

				
			</WLMain>

			{
				showDelete && (<Delete deleteList={deleteList} activeid={activeList._id} setShowDelete={setShowDelete} />)
			}

			{
				showCreate && (<CreateAccount fetchUser={props.fetchUser} setShowCreate={setShowCreate} />)
			}

			{
				showLogin && (<Login fetchUser={props.fetchUser} refetchTodos={refetch}setShowLogin={setShowLogin} />)
			}

			{
				showEdit && (<EditAccount  fetchUser={props.fetchUser} setShowEdit={setShowEdit} user={user} getUser={getUser}/>)
			}



			
			
			
			

			

			


		</WLayout>
	);
};

export default Homescreen;
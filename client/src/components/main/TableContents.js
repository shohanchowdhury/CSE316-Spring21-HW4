import React        from 'react';
import TableEntry   from './TableEntry';

const TableContents = (props) => {

    const entries = props.activeList ? props.activeList.items : null;
    return (
        entries ? <div className=' table-entries container-primary'>
            {
                // console.log(entries.[1]),
                entries.map((entry, index) => (
                    <TableEntry
                        data={entry} key={entry.id}
                        deleteItem={props.deleteItem} reorderItem={props.reorderItem}
                        editItem={props.editItem}
                        activeList={props.activeList}
                    />
                ))
            }
{/* 
            {
                entries.map((entry, index) => (
                    <TableEntry
                        data={entry} key={entry.id}
                        deleteItem={props.deleteItem} reorderItem={props.reorderItem}
                        editItem={props.editItem}
                    />
                ))
            } */}

            </div>
            : <div className='container-primary' />
    );
};

export default TableContents;
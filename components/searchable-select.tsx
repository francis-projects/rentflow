"use client";

import { useId, useState } from "react";

type Option={value:string;label:string};
export function SearchableSelect({name,label,options,required=false,placeholder="Type to search...",defaultValue=""}:{name:string;label:string;options:Option[];required?:boolean;placeholder?:string;defaultValue?:string}) {
 const id=useId();
 const initial=options.find(option=>option.value===defaultValue);
 const [query,setQuery]=useState(initial?.label??"");
 const [selected,setSelected]=useState(initial?.value??"");
 const listId=id+"-options";
 function change(next:string){
  setQuery(next);
  const match=options.find(option=>option.label.toLocaleLowerCase()===next.trim().toLocaleLowerCase());
  setSelected(match?.value??"");
 }
 return <label>{label}<input type="text" list={listId} value={query} placeholder={placeholder} required={required} autoComplete="off" onChange={event=>change(event.target.value)} onBlur={()=>{if(query.trim()&&!options.some(option=>option.label.toLocaleLowerCase()===query.trim().toLocaleLowerCase())){setQuery("");setSelected("");}}}/><datalist id={listId}>{options.map(option=><option key={option.value} value={option.label}/>)}</datalist><input type="hidden" name={name} value={selected}/></label>;
}

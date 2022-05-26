ffl={};
ffl.tokens=[];
ffl.keywords=
{
	if:true,
	while:true,
	do:true,
	for:true,
	return:true,
	var:true,
	let:true,
	const:true,
	function:true,
	break:true,
	await:true,
	async:true,
	continue:true,
	new:true,
	this:true,
	try:true,
	catch:true,
	goto:true,
	in:true,
	of:true,
	super:true,
	throw:true,
	class:true,
	switch:true,
	finally:true,
	default:true,
	enum:true,
	case:true,
	arguments:true,
	extends:true,
	else:true,
};
ffl.trie=
{
	root:{},
	add:(...words)=>
	{
		for(let word of words)
		{
			let n=ffl.trie.root;
			for(let c of word)
			{
				if(!n[c]) n[c]={};
				n=n[c];
			}
		}

	},
	has:word=>
	{
		let n=ffl.trie.root;
		let buf="";
		for(let c of word)
		{
			n=n[c];
			if(!n) return false;
			buf+=c;
			if(buf==word) return true;
		}
		return false;
	}
};
ffl.trie.add("^=",">>=",">=","<<=","<=","===","!==","&&","&=","||","|=","+=","-=","*=","/=","%=","^");

ffl.init=src=>
{
	ffl.src=src;
	ffl.i=-1;
	ffl.a=0;
	ffl.c=``;
	ffl.next();
	ffl.lex();
	ffl.i=-1;
	ffl.c=ffl.tokens[0];
	ffl.parse();
}

ffl.next=(buf=``)=>
{
	buf+=ffl.c;
	ffl.i++;
	ffl.a=ffl.src.charCodeAt(ffl.i);
	ffl.c=ffl.src[ffl.i];
	return buf;
}

ffl.undo=i=>{ffl.i=i-1;ffl.next();}
ffl.peekop=i=>ffl.ops[ffl.src.charCodeAt(ffl.i+i)];
ffl.peekc=i=>ffl.src[ffl.i+i];
ffl.isop=fn=>ffl.ops[ffl.a]==fn;
ffl.eof=_=>ffl.i>=ffl.src.length;
ffl.nop=_=>ffl.next();

ffl.letter=_=>
{
	let buf=ffl.c;
	ffl.next();
	while(ffl.isop(ffl.letter)||ffl.isop(ffl.digit))
	{
		buf=ffl.next(buf);
	}
	if(ffl.keywords[buf])
	{
		ffl.tokens.push({type:`keyword`,value:buf});
		return;
	}
	ffl.tokens.push({type:`id`,value:buf});
}

ffl.digit=_=>
{
	let buf=``;
	while(ffl.isop(ffl.digit))buf=ffl.next(buf);
	if(ffl.c==`.`&&ffl.peekop(1)==ffl.digit)
	{
		buf=ffl.next(buf);
		while(ffl.isop(ffl.digit))buf=ffl.next(buf);
	}
	ffl.tokens.push({type:`number`,value:buf});
}

ffl.operator=_=>
{
	let buf=``;
	let i=ffl.i;
	let c=ffl.c;
	while(ffl.isop(ffl.operator))
	{
		buf=ffl.next(buf);
	}
	if(ffl.trie.has(buf))
	{
		return ffl.tokens.push({type:`operator`,value:buf});
	}
	ffl.undo(i+1); /* Only gets here if synax error. rollback in case. */
	ffl.tokens.push({type:`operator`,value:c});
}

ffl.str=_=>
{
	let c=ffl.c;/*match on this so we can reuse it for all string types.*/
	let buf=ffl.next(``);
	let i=ffl.i;
	while(ffl.c!=c)
	{
		if(ffl.eof()) return ffl.undo(i);
		buf=ffl.next(buf);
	}
	buf=ffl.next(buf);
	ffl.tokens.push({type:`string`,value:buf});
}

ffl.char=_=>
{
	ffl.tokens.push({type:`char`,value:ffl.c});
	ffl.next();
}

ffl.ops=[];
for(let i=0;i<=32;i++) ffl.ops[i]=ffl.nop;
ffl.ops[33]=ffl.operator; /* ! */
ffl.ops[34]=ffl.str; /* " */
ffl.ops[35]=ffl.nop;
ffl.ops[36]=ffl.nop;
ffl.ops[37]=ffl.operator; /* % */
ffl.ops[38]=ffl.operator; /* & */
ffl.ops[39]=ffl.str; /* ' */
ffl.ops[40]=ffl.char; /* ( */
ffl.ops[41]=ffl.char; /* ) */
ffl.ops[42]=ffl.operator; /* * */
ffl.ops[43]=ffl.operator; /* + */
ffl.ops[44]=ffl.nop;
ffl.ops[45]=ffl.operator; /* - */
ffl.ops[46]=ffl.nop;
ffl.ops[47]=ffl.operator; /* / */
for(let i=48;i<=57;i++) ffl.ops[i]=ffl.digit;
ffl.ops[58]=ffl.nop;
ffl.ops[59]=ffl.nop;
ffl.ops[60]=ffl.operator; /* < */
ffl.ops[61]=ffl.operator; /* = */
ffl.ops[62]=ffl.operator; /* > */
ffl.ops[63]=ffl.operator; /* ? */
ffl.ops[64]=ffl.nop;
for(let i=65;i<=90;i++) ffl.ops[i]=ffl.letter;
ffl.ops[91]=ffl.char; /* [ */
ffl.ops[92]=ffl.nop;
ffl.ops[93]=ffl.char; /* ] */
ffl.ops[94]=ffl.operator; /* ^ */
ffl.ops[95]=ffl.letter; /* _ */
ffl.ops[96]=ffl.str; /* ` */
for(let i=97;i<=122;i++) ffl.ops[i]=ffl.letter;
ffl.ops[123]=ffl.char; /* { */
ffl.ops[124]=ffl.nop;
ffl.ops[125]=ffl.char; /* } */
ffl.ops[126]=ffl.operator; /* ~ */
ffl.ops[127]=ffl.nop;

ffl.lex=_=>
{
	while(!ffl.eof()) ffl.ops[ffl.a]();
}

ffl.parse=_=>
{
	for(let token of ffl.tokens)
	{
		console.log(token);
	}
}

ffl.init(`console.log("Hello World") 32.12341 + {} this [*] is % a >> test ==`);
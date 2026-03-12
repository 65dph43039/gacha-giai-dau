
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const opportunities = [
      { name: "Sinh viên nghèo", desc: "Khi toàn bộ nhân vật trong đội hình của một ải đều là tinh hồn 0, cộng 400 điểm nếu chỉ có 1 nhân vật Limited, 200 điểm với các trường hợp còn lại. Các nhân vật Kim Linh, Banner Thường, 4 sao, Nhà Khai Phá được bypass điều kiện tinh hồn 0." },
      { name: "Đồng điệu", desc: "Khi toàn bộ nhân vật của một ải cùng phẩm chất, điểm thưởng nhận thêm bằng 1/5 số AV bạn còn thừa. Với phẩm chất 4 sao, cộng thêm 400đ. Tối đa có 600 điểm BONUS được cộng xuyên suốt 2 ải đấu." },
      { name: "Trái Ngọt", desc: "Thay vì bị phạt điểm tinh hồn và tích tầng, bạn có thể lựa chọn 1 trong hai cách để bị phạt điểm AV như sau: 1. Phạt 20 điểm với mỗi AV được sử dụng ở tầng 1; 2. Phạt 10 điểm với mỗi AV được sử dụng trong cả 2 ải đấu. Yêu cầu tối thiểu: Sử dụng ít nhất 50AV. Khi sử dụng ít hơn 50AV thì phạt tinh hồn theo quy định" },
      { name: "Bảo Hộ", desc: "Được lựa chọn 1 trong hai hỗ trợ sau: 1. Thêm 2 lần rerun; 2. Miễn hình phạt nội tại Castorice cho 2 ải." },
      { name: "Cải tử hoàn sinh", desc: "Được phép thay đổi 1 nhân vật và nón ánh sáng của nhân vật đó 1 lần mỗi ải đấu. Một khi đã thay đổi thì sẽ dùng đến khi hoàn thành ải đấu. Đồng thời nhận thêm 100 điểm BONUS nếu không phát sinh thêm lần rerun nào." },
      { name: "Mặt nạ thần bí", desc: "Bạn được lựa chọn 1 trong 2 lõi sau: 1. Cộng 400 điểm BONUS;  2. Chọn 1 trong các Cơ Hội khác TÙY Ý." }
    ];

    const challenges = [
      { name: "Đường Cùng", desc: "Khi hoàn toàn kết thúc thi đấu, nếu số điểm AV còn lại của 1 tầng rơi xuống mức nhỏ hơn 1050AV, đội của tuyển thủ đó lập tức bị xử thua" },
      { name: "Cảm giác an toàn đã biến mất", desc: "Cơ hội “Bảo Hộ” bị vô hiệu hóa. Mất toàn bộ 3 lượt rerun miễn phí. Hình phạt rerun vượt mức và phạt điểm Global Passive Castorice sẽ được viết lại như sau. Từ giờ, mỗi lần rerun sẽ phạt 100 điểm BONUS, sử dụng Global Passive Castorice sẽ phạt 100 điểm BONUS." },
      { name: "Sếp Yao tới chơi", desc: "Số lượng Cơ Hội được phép lựa chọn tăng thêm 1." },
      { name: "Cuộc gặp gỡ của các thiên tài", desc: "Toàn bộ hai đội tuyển thủ, mỗi bên BẮT BUỘC phải sử dụng ít nhất 4 nón ánh sáng 4 sao" },
      { name: "Hôm nay may mắn đấy", desc: "Số lượng nhân vật bị cấm giảm còn 1 mỗi bên. Đội nào có tổng điểm thi đấu thấp hơn sẽ được cộng thêm 50 điểm BONUS." },
      { name: "Khỉ đuổi theo gió", desc: "Số lượng nhân vật bị cấm mỗi bên tăng lên 4, số lượng nón ánh sáng bị cấm giảm còn 0." }
    ];

    /* src\Gacha.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\Gacha.svelte";

    // (65:2) {#if choice}
    function create_if_block_3(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Quay";
    			attr_dev(button, "class", "roll-btn");
    			add_location(button, file$1, 66, 6, 1711);
    			attr_dev(div, "class", "nav");
    			add_location(div, file$1, 65, 4, 1686);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleRoll*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(65:2) {#if choice}",
    		ctx
    	});

    	return block;
    }

    // (70:2) {#if showAnimation}
    function create_if_block_2(ctx) {
    	let div;
    	let video;
    	let video_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			video = element("video");
    			if (!src_url_equal(video.src, video_src_value = /*videoPath*/ ctx[4])) attr_dev(video, "src", video_src_value);
    			video.autoplay = true;
    			add_location(video, file$1, 71, 6, 1852);
    			attr_dev(div, "class", "animation");
    			add_location(div, file$1, 70, 4, 1821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, video);

    			if (!mounted) {
    				dispose = listen_dev(video, "ended", /*handleAnimationEnd*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*videoPath*/ 16 && !src_url_equal(video.src, video_src_value = /*videoPath*/ ctx[4])) {
    				attr_dev(video, "src", video_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(70:2) {#if showAnimation}",
    		ctx
    	});

    	return block;
    }

    // (75:2) {#if showResult}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let span;
    	let t0_value = /*result*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let div1;

    	function select_block_type(ctx, dirty) {
    		if (/*choice*/ ctx[0] === "number") return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(span, "class", "caption");
    			add_location(span, file$1, 77, 6, 2033);
    			attr_dev(div0, "class", "wrapper");
    			add_location(div0, file$1, 76, 4, 2004);
    			attr_dev(div1, "class", "content");
    			add_location(div1, file$1, 79, 4, 2093);
    			attr_dev(div2, "class", "result-card star5");
    			add_location(div2, file$1, 75, 2, 1967);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span);
    			append_dev(span, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if_block.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 2 && t0_value !== (t0_value = /*result*/ ctx[1].name + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(75:2) {#if showResult}",
    		ctx
    	});

    	return block;
    }

    // (85:6) {:else}
    function create_else_block(ctx) {
    	let t_value = /*result*/ ctx[1].desc + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 2 && t_value !== (t_value = /*result*/ ctx[1].desc + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(85:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:6) {#if choice === "number"}
    function create_if_block_1(ctx) {
    	let span;
    	let t_value = /*result*/ ctx[1].desc + "";
    	let t;
    	let span_class_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", span_class_value = "big-number " + (/*result*/ ctx[1].desc < 0 ? 'bad' : 'good'));
    			add_location(span, file$1, 81, 8, 2157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*result*/ 2 && t_value !== (t_value = /*result*/ ctx[1].desc + "")) set_data_dev(t, t_value);

    			if (dirty & /*result*/ 2 && span_class_value !== (span_class_value = "big-number " + (/*result*/ ctx[1].desc < 0 ? 'bad' : 'good'))) {
    				attr_dev(span, "class", span_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:6) {#if choice === \\\"number\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div3;
    	let div2;
    	let button0;
    	let t1;
    	let div0;
    	let t2;
    	let button1;
    	let t4;
    	let div1;
    	let t5;
    	let button2;
    	let t7;
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;
    	let if_block0 = /*choice*/ ctx[0] && create_if_block_3(ctx);
    	let if_block1 = /*showAnimation*/ ctx[2] && create_if_block_2(ctx);
    	let if_block2 = /*showResult*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Gacha Cơ hội";
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Gacha Thách thức";
    			t4 = space();
    			div1 = element("div");
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Gacha Số";
    			t7 = space();
    			if (if_block0) if_block0.c();
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			toggle_class(button0, "active", /*choice*/ ctx[0] === "opportunity");
    			add_location(button0, file$1, 48, 2, 1220);
    			attr_dev(div0, "class", "divider");
    			add_location(div0, file$1, 52, 2, 1350);
    			toggle_class(button1, "active", /*choice*/ ctx[0] === "challenge");
    			add_location(button1, file$1, 54, 2, 1383);
    			attr_dev(div1, "class", "divider");
    			add_location(div1, file$1, 58, 2, 1513);
    			toggle_class(button2, "active", /*choice*/ ctx[0] === "number");
    			add_location(button2, file$1, 60, 2, 1546);
    			attr_dev(div2, "class", "header");
    			add_location(div2, file$1, 47, 2, 1196);
    			attr_dev(div3, "class", "gacha-app");
    			add_location(div3, file$1, 46, 0, 1169);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, button1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div2, t5);
    			append_dev(div2, button2);
    			append_dev(div3, t7);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t8);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t9);
    			if (if_block2) if_block2.m(div3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*choice*/ 1) {
    				toggle_class(button0, "active", /*choice*/ ctx[0] === "opportunity");
    			}

    			if (dirty & /*choice*/ 1) {
    				toggle_class(button1, "active", /*choice*/ ctx[0] === "challenge");
    			}

    			if (dirty & /*choice*/ 1) {
    				toggle_class(button2, "active", /*choice*/ ctx[0] === "number");
    			}

    			if (/*choice*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div3, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showAnimation*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div3, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*showResult*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div3, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let videoPath;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Gacha', slots, []);
    	let choice = "";
    	let result = null;
    	let showAnimation = false;
    	let showResult = false;

    	function handleSelect(type) {
    		$$invalidate(0, choice = type);
    		$$invalidate(3, showResult = false);
    		$$invalidate(1, result = null);
    	}

    	function handleRoll() {
    		if (!choice) return;
    		$$invalidate(2, showAnimation = true);
    		$$invalidate(3, showResult = false);
    		$$invalidate(1, result = null);
    	}

    	function handleAnimationEnd() {
    		if (choice === "opportunity") {
    			$$invalidate(1, result = opportunities[Math.floor(Math.random() * opportunities.length)]);
    		} else if (choice === "challenge") {
    			$$invalidate(1, result = challenges[Math.floor(Math.random() * challenges.length)]);
    		} else if (choice === "number") {
    			const num = Math.floor(Math.random() * (200 - -50 + 1)) - 50;

    			$$invalidate(1, result = {
    				name: "Thời khắc Aha đã giúp bạn nhận được số điểm BONUS là:",
    				desc: num
    			});
    		}

    		$$invalidate(2, showAnimation = false);
    		$$invalidate(3, showResult = true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Gacha> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleSelect("opportunity");
    	const click_handler_1 = () => handleSelect("challenge");
    	const click_handler_2 = () => handleSelect("number");

    	$$self.$capture_state = () => ({
    		opportunities,
    		challenges,
    		choice,
    		result,
    		showAnimation,
    		showResult,
    		handleSelect,
    		handleRoll,
    		handleAnimationEnd,
    		videoPath
    	});

    	$$self.$inject_state = $$props => {
    		if ('choice' in $$props) $$invalidate(0, choice = $$props.choice);
    		if ('result' in $$props) $$invalidate(1, result = $$props.result);
    		if ('showAnimation' in $$props) $$invalidate(2, showAnimation = $$props.showAnimation);
    		if ('showResult' in $$props) $$invalidate(3, showResult = $$props.showResult);
    		if ('videoPath' in $$props) $$invalidate(4, videoPath = $$props.videoPath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*choice*/ 1) {
    			// Video path theo loại
    			$$invalidate(4, videoPath = choice === "opportunity"
    			? "/gacha-opportunity.mp4"
    			: choice === "number"
    				? "/gacha-number.mp4"
    				: choice === "challenge" ? "/gacha-challenge.mp4" : "");
    		}
    	};

    	return [
    		choice,
    		result,
    		showAnimation,
    		showResult,
    		videoPath,
    		handleSelect,
    		handleRoll,
    		handleAnimationEnd,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Gacha extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gacha",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let gacha;
    	let current;
    	gacha = new Gacha({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(gacha.$$.fragment);
    			set_style(div, "background", "url('/bg-gacha.jpg')");
    			set_style(div, "background-size", "cover");
    			set_style(div, "min-height", "100vh");
    			set_style(div, "padding", "0");
    			add_location(div, file, 4, 0, 58);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(gacha, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gacha.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gacha.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(gacha);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Gacha });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map

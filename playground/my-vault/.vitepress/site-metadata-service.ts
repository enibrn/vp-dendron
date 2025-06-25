import fs from 'fs';
import type { DendronNoteItem, HomeCard, NavItem, SidebarItem } from './types';

type GetItemsFn = () => DendronNoteItem[];

export class SiteMetadataService {
  // public props
  public readonly nav: NavItem[] = [];
  public readonly sidebar: Record<string, SidebarItem[]> = {};
  public readonly linksVocabulary: Record<string, string> = {};
  public readonly homeCards: HomeCard[] = [];
  public readonly itemsLoggedTest: DendronNoteItem[] = [];
  public readonly srcExclude: string[] = [];
  public readonly redirects: Record<string, string> = {};

  // private props
  #items: DendronNoteItem[] = [];
  #sidebarLeafLinks: Record<string, string> = {};
  #leafItems: Array<DendronNoteItem & { link: string }> = [];

  constructor(getItemsFn: GetItemsFn, isTest?: boolean) {
    this.#items = getItemsFn();

    if (isTest) {
      this.itemsLoggedTest = this.#items;
    }

    this.#traverseItemsHierarchically();
    this.#setHomeCards();
  }

  #traverseItemsHierarchically(): void {
    const highestItemsOrdered = this.#items
      .filter(x => x.level === 1)
      .sort((a, b) => a.order - b.order);

    for (const item of highestItemsOrdered) {
      this.nav.push(this.#traverseUntilSideItem(item));
    }
  }

  #traverseUntilSideItem(item: DendronNoteItem): NavItem {
    const childItems = this.#getChildsOrdered(item);
    const result: NavItem = { text: item.title };

    if ((item as any).side) {
      //from now on I will traverse from the side item, to manage sidebar and leaf data
      const sidebarItems: SidebarItem[] = [];
      for (const childItem of childItems) {
        sidebarItems.push(
          this.#traverseAfterSideItem(
            childItem,
            item.key,
            (item as any).side.landIntoLastPage
          )
        );
      }
      this.sidebar[item.key] = sidebarItems;

      //the nav link goes to the proper preselected "leaf" page
      const sidebarLeafLink = this.#sidebarLeafLinks[item.key];
      result.link = sidebarLeafLink;

      if ((item as any).side.collapseOtherFirstLevels) {
        const childItemToExpandKey = childItems
          .map(x => x.key)
          .find(x => sidebarLeafLink && sidebarLeafLink.startsWith('/' + x + '.'));

        for (const sidebarItem of sidebarItems) {
          sidebarItem.collapsed = sidebarItem.key !== childItemToExpandKey;
        }
      }
    } else {
      result.items = [];
      for (const childItem of childItems) {
        result.items.push(this.#traverseUntilSideItem(childItem));
      }
    }

    this.srcExclude.push(item.relativeFilePath);

    return result;
  }

  #traverseAfterSideItem(
    item: DendronNoteItem,
    navKey: string,
    landIntoLastPage?: boolean
  ): SidebarItem {
    const childItems = this.#getChildsOrdered(item);
    const result: SidebarItem = { key: item.key, text: item.title };

    if (childItems.length === 0) {
      result.link = '/' + item.key;
      this.linksVocabulary[item.key] = item.title;
      this.#leafItems.push({ ...item, link: result.link });

      if (landIntoLastPage || !this.#sidebarLeafLinks[navKey]) {
        this.#sidebarLeafLinks[navKey] = result.link;
      }

      this.redirects[item.id] = `/eniblog/${item.key}`;
    } else {
      result.items = [];
      for (const childItem of childItems) {
        result.items.push(
          this.#traverseAfterSideItem(childItem, navKey, landIntoLastPage)
        );
      }

      this.srcExclude.push(item.relativeFilePath);
    }

    return result;
  }

  #getChildsOrdered(father: DendronNoteItem): DendronNoteItem[] {
    return this.#items
      .filter(item => {
        const regex = new RegExp(`^${father.key}\\.([^\\.]+)$`);
        return regex.test(item.key);
      })
      .sort((a, b) => a.order - b.order);
  }

  #setHomeCards(): void {
    const lastCreatedItems = [...this.#leafItems]
      .sort((a, b) => (b as any).createdTimestamp - (a as any).createdTimestamp)
      .slice(0, 4);
    const lastCreatedCards = this.#getHomeCards(lastCreatedItems, true);

    const lastUpdatedItems = [...this.#leafItems]
      .filter(x => !lastCreatedItems.some(y => y.key === x.key))
      .sort((a, b) => (b as any).updatedTimestamp - (a as any).updatedTimestamp)
      .slice(0, 4);
    const lastUpdatedCards = this.#getHomeCards(lastUpdatedItems, false);
    this.homeCards.push(...lastCreatedCards, ...lastUpdatedCards);
  }

  #getHomeCards(
    lastItems: Array<DendronNoteItem & { link: string }>,
    isNew: boolean
  ): HomeCard[] {
    const results: HomeCard[] = [];

    for (const item of lastItems) {
      const fcontent = fs.readFileSync(item.relativeFilePath, 'utf-8');

      const result: HomeCard = {
        title: item.title,
        details: SiteMetadataService.#getCardBody(fcontent, item, isNew),
        link: item.link,
        // icon: {
        //   src: SiteMetadataService.#getFirstImageLink(fcontent),
        //   width: '100px'
        // }
      };

      results.push(result);
    }

    return results;
  }

  static #getCardBody(
    fcontent: string,
    item: DendronNoteItem & { link: string },
    isNew: boolean
  ): string {
    const excerpt = SiteMetadataService.#getExcerpt(fcontent);

    const badgeClass = isNew ? 'tip' : 'info';

    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    const formatDate = (date: Date) => date.toLocaleDateString('it-IT', options);
    const dateString = isNew
      ? formatDate((item as any).createdDate)
      : formatDate((item as any).updatedDate);
    const badgeText = isNew
      ? `Creato il ${dateString}`
      : `Aggiornato il ${dateString}`;

    return `${excerpt}<br><br><span class="VPBadge ${badgeClass}">${badgeText}</span>`;
  }

  static #getExcerpt(fcontent: string): string {
    //this will take the incipit between the two --- lines, or the rest of the article
    //it could throw an error on [2] if blank note, should never happen
    //elsewhere rethink also how lastItems are taken, skip blank note etc...
    const content = fcontent.split('---')[2]?.split('#')[0].trim() ?? '';
    return truncate(content, 100, true);

    function truncate(str: string, n: number, useWordBoundary: boolean): string {
      if (str.length <= n) {
        return str;
      }
      const subString = str.slice(0, n - 1);
      return (
        (useWordBoundary
          ? subString.slice(0, subString.lastIndexOf(' '))
          : subString) + '...'
      );
    }
  }

  //similar to logic in ImageManager of dendron-move-images
  static #getFirstImageLink(fcontent: string): string | null {
    let result: string | null = null;
    const imageRegex = /!\[([^\]]+)\]\(([^)]+)\)/g;

    let match: RegExpExecArray | null;
    while ((match = imageRegex.exec(fcontent)) !== null) {
      if (isInCodeBlock(match)) continue;

      //found the first image
      result = match[2];
      break;
    }

    //TODO needed format: "./notes/assets/images/zirael.jpg"
    return result;

    function isInCodeBlock(match: RegExpExecArray): boolean {
      const stringBeforeMatch = match.input.substring(0, match.index);
      const numOfBackTicks = (stringBeforeMatch.match(/`/g) || []).length;
      return numOfBackTicks % 2 !== 0;
    }
  }
}

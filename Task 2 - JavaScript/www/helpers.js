export const createGalleryElement = (artwork) => {
    const gallery = document.getElementById("gallery");

    const galleryItem = document.createElement('div');
    galleryItem.innerHTML = `
    <div class="thumb">
      <a class="link" href=${"framing.html?objectID=" + artwork.objectID} id=${artwork.objectID}>
      <img src=${artwork.primaryImageSmall} alt=${artwork.title} id=${artwork.objectID} image-info>
      <div class="museum-label">
        <span class="artist">${artwork.artistDisplayName}</span>
        <span class="title">${artwork.title}</span>,
        <span class="date">${artwork.objectDate}</span>
      </div>
      </a>
    </div>`
  
    gallery.appendChild(galleryItem);

    return galleryItem;
}